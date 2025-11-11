import { FastifyInstance, FastifyRequest } from "fastify";
import { ClientError } from "graphql-request";

import { mylog } from "../helper";
import callStrapi from "../services/callStrapi";
import { callGPT, findPrompt } from "../services/gpt";
import {
  CreateReviewMutation,
  ReviewByFingerprintQuery,
} from "../services/queries";
import { IReview, IReviewCheckResponse } from "../types/review";

type ReviewRequest = FastifyRequest<{
  Body: Partial<IReview>;
}>;

type ReviewMutationInput = {
  text: string;
  exchanger: string;
  fingerprint: string;
  type: NonNullable<IReview["type"]>;
  isDispute?: boolean | null;
  userAgent?: string;
  location?: string;
  ipAddress?: string;
  honeypot?: string;
};

const REVIEW_TYPES: NonNullable<IReview["type"]>[] = [
  "positive",
  "neutral",
  "negative",
  "question",
];
const DEFAULT_REVIEW_TYPE: NonNullable<IReview["type"]> = "question";

const pickString = (value?: unknown) =>
  typeof value === "string" && value.trim().length ? value.trim() : undefined;

const isValidGptResponse = (
  payload: unknown
): payload is IReviewCheckResponse => {
  if (!payload || typeof payload !== "object") return false;
  const data = payload as Record<string, unknown>;
  return (
    typeof data.isApproved === "boolean" &&
    typeof data.comment === "string" &&
    typeof data.tone === "string"
  );
};

const parseGptResponse = (payload: unknown): IReviewCheckResponse | null => {
  if (!payload) return null;

  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      return isValidGptResponse(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return isValidGptResponse(payload) ? (payload as IReviewCheckResponse) : null;
};

const buildReviewInput = (
  raw: Partial<IReview>
): { data?: ReviewMutationInput; error?: string } => {
  const text = pickString(raw.text);
  const exchangerId = pickString(raw.exchangerId);
  const fingerprint = pickString(raw.fingerprint);

  if (!text || !exchangerId || !fingerprint) {
    return { error: "Text, exchanger, and fingerprint are required" };
  }

  const payload: ReviewMutationInput = {
    text,
    exchanger: exchangerId,
    fingerprint,
    type:
      raw.type && REVIEW_TYPES.includes(raw.type)
        ? (raw.type as NonNullable<IReview["type"]>)
        : DEFAULT_REVIEW_TYPE,
  };

  if (typeof raw.isDispute === "boolean" || raw.isDispute === null) {
    payload.isDispute = raw.isDispute;
  }

  const userAgent = pickString(raw.userAgent);
  if (userAgent) payload.userAgent = userAgent;

  const location = pickString(raw.location);
  if (location) payload.location = location;

  const honeypot = pickString(raw.honeypot);
  if (honeypot) payload.honeypot = honeypot;

  return { data: payload };
};

const attachIpAddress = (
  request: ReviewRequest,
  reviewInput: ReviewMutationInput
) => {
  const forwardedFor = request.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor;
  const forwardedIp = pickString(forwardedValue);

  if (forwardedIp) {
    reviewInput.ipAddress = forwardedIp.split(",")[0]?.trim();
  } else if (request.ip) {
    reviewInput.ipAddress = request.ip;
  }
};

const registerCreateReviewRoute = (server: FastifyInstance) => {
  server.post("/createReview", async function (request: ReviewRequest, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const review = request.body ?? {};
    server.log.info({ review }, "Received /createReview payload");

    const honeypotValue = pickString(review.honeypot);
    if (honeypotValue) {
      server.log.warn(
        { honeypot: honeypotValue, fingerprint: review.fingerprint },
        "Honeypot triggered, skipping review creation"
      );
      return reply.send({ status: "ok" });
    }

    const { data: reviewInput, error } = buildReviewInput(review);
    if (!reviewInput) {
      reply.status(400).send({
        status: "error",
        message: error ?? "Invalid review payload",
      });
      return;
    }

    attachIpAddress(request, reviewInput);

    const hasTooManyReviews = async (fingerprint: string) => {
      try {
        const existing = await callStrapi(ReviewByFingerprintQuery, {
          fingerprint,
        });
        const reviews = existing?.reviews;
        return (
          Array.isArray(reviews) &&
          reviews.length > +(process.env.ALLOWED_REVIEWS_PER_FINGERPRINT || 5)
        );
      } catch (err) {
        server.log.warn(
          { err, fingerprint },
          "Failed to check review duplicates, skipping duplicate guard"
        );
        return false;
      }
    };

    try {
      if (
        reviewInput.fingerprint &&
        (await hasTooManyReviews(reviewInput.fingerprint))
      ) {
        mylog(
          `Review with fingerprint ${reviewInput.fingerprint} already exists, skipping creation`,
          "warning"
        );
        return reply.send({ status: "ok" });
      }

      const prompt = await findPrompt("review");
      if (!prompt) {
        throw new Error("no prompt found for review");
      }
      mylog("Prompt found", "success");

      const rawGptResponse = await callGPT(
        `${prompt} | Review text: ${reviewInput.text}`,
        `[${reviewInput.exchanger} review]`
      );

      const gptResponse = parseGptResponse(rawGptResponse);

      if (!gptResponse) {
        mylog(
          "GPT response could not be parsed as JSON, proceeding without moderation data",
          "warning"
        );
      } else if (!gptResponse.isApproved) {
        mylog(`not approved: ${JSON.stringify(gptResponse)}`, "warning");
        return reply.send({ status: "ok" });
      }
      mylog(`${JSON.stringify(gptResponse, undefined, 4)}`, "important");

      const strapiResponse = await callStrapi(CreateReviewMutation, {
        data: reviewInput,
      });

      const createdReview = strapiResponse?.createReview;

      if (!createdReview?.id) {
        throw new Error("createReview mutation returned empty payload");
      }

      mylog(`Review created ${createdReview.id}`, "success");
      reply.send({
        status: "ok",
      });
    } catch (err) {
      server.log.error(err, "Failed to create review");
      if (err instanceof ClientError) {
        const graphError = err.response?.errors?.[0];
        const code = graphError?.extensions?.code;
        const message =
          graphError?.message || err.message || "Failed to create review";
        const statusCode = code === "BAD_USER_INPUT" ? 400 : 502;
        reply.status(statusCode).send({
          status: "error",
          message,
          code,
        });
        return;
      }

      reply.status(502).send({
        status: "error",
        message: "Failed to create review",
      });
    }
  });

  server.options("/createReview", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
    reply.status(204).send();
  });
};

export default registerCreateReviewRoute;

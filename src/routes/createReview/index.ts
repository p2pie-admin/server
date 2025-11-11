import { FastifyInstance } from "fastify";
import { randomBytes } from "crypto";
import { ClientError } from "graphql-request";

import { mylog } from "../../helper";
import callStrapi from "../../services/callStrapi";
import { CreateReviewMutation } from "../../services/queries";
import { pickString } from "./utils";
import { buildReviewInput } from "./payloadBuilder";
import { attachIpAddress } from "./ipAddress";
import { hasTooManyReviews } from "./duplicateGuard";
import { runModeration } from "./moderation";
import { ReviewRequest } from "./types";

const makeFingerprintUnique = (fingerprint: string) => {
  const suffix = randomBytes(4).toString("hex");
  return `${fingerprint}_${suffix}`;
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

    const buildResult = buildReviewInput(review);
    const reviewInput = buildResult.data;
    const typeProvided = buildResult.meta?.typeProvided ?? false;
    const error = buildResult.error;
    if (!reviewInput) {
      reply.status(400).send({
        status: "error",
        message: error ?? "Invalid review payload",
      });
      return;
    }

    attachIpAddress(request, reviewInput);
    const baseFingerprint = reviewInput.fingerprint;

    try {
      if (
        baseFingerprint &&
        (await hasTooManyReviews(baseFingerprint, server.log))
      ) {
        mylog(
          `Review with fingerprint ${reviewInput.fingerprint} already exists, skipping creation`,
          "warning"
        );
        return reply.send({ status: "ok" });
      }

      const moderationResult = await runModeration(reviewInput);
      const gptResponse = moderationResult.response;

      if (gptResponse) {
        reviewInput.ai_data = gptResponse;
        reviewInput.isApproved = gptResponse.isApproved;

        if (typeof gptResponse.changedVersion === "string") {
          reviewInput.text = gptResponse.changedVersion;
        }

        if (!typeProvided) {
          reviewInput.type = gptResponse.tone;
        }
      } else {
        reviewInput.isApproved = false;
      }

      reviewInput.fingerprint = makeFingerprintUnique(baseFingerprint);

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

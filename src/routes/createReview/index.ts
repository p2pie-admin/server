import { FastifyInstance } from "fastify";
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

    try {
      if (
        reviewInput.fingerprint &&
        (await hasTooManyReviews(reviewInput.fingerprint, server.log))
      ) {
        mylog(
          `Review with fingerprint ${reviewInput.fingerprint} already exists, skipping creation`,
          "warning"
        );
        return reply.send({ status: "ok" });
      }

      const moderationResult = await runModeration(reviewInput);
      if (!moderationResult.approved) {
        return reply.send({ status: "ok" });
      }

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
        data: { id: createdReview.id },
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

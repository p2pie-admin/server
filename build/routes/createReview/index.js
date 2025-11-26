"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const graphql_request_1 = require("graphql-request");
const helper_1 = require("../../helper");
const callStrapi_1 = __importDefault(require("../../services/callStrapi"));
const queries_1 = require("../../services/queries");
const utils_1 = require("./utils");
const payloadBuilder_1 = require("./payloadBuilder");
const ipAddress_1 = require("./ipAddress");
const duplicateGuard_1 = require("./duplicateGuard");
const moderation_1 = require("./moderation");
const makeFingerprintUnique = (fingerprint) => {
    const suffix = (0, crypto_1.randomBytes)(4).toString("hex");
    return `${fingerprint}_${suffix}`;
};
const registerCreateReviewRoute = (server) => {
    server.post("/createReview", async function (request, reply) {
        reply.header("Access-Control-Allow-Origin", "*");
        const review = request.body ?? {};
        (0, helper_1.mylog)(`/createReview body: ${JSON.stringify(review)}`, "important");
        server.log.info({ review }, "Received /createReview payload");
        const honeypotValue = (0, utils_1.pickString)(review.honeypot);
        if (honeypotValue) {
            server.log.warn({ honeypot: honeypotValue, fingerprint: review.fingerprint }, "Honeypot triggered, skipping review creation");
            return reply.send({ status: "ok" });
        }
        const buildResult = (0, payloadBuilder_1.buildReviewInput)(review);
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
        (0, ipAddress_1.attachIpAddress)(request, reviewInput);
        const baseFingerprint = reviewInput.fingerprint;
        try {
            if (baseFingerprint &&
                (await (0, duplicateGuard_1.hasTooManyReviews)(baseFingerprint, server.log))) {
                (0, helper_1.mylog)(`Review with fingerprint ${reviewInput.fingerprint} already exists, skipping creation`, "warning");
                return reply.send({ status: "ok" });
            }
            const moderationResult = await (0, moderation_1.runModeration)(reviewInput);
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
            }
            else {
                reviewInput.isApproved = false;
            }
            reviewInput.fingerprint = makeFingerprintUnique(baseFingerprint);
            const strapiResponse = await (0, callStrapi_1.default)(queries_1.CreateReviewMutation, {
                data: reviewInput,
            });
            const createdReview = strapiResponse?.createReview;
            if (!createdReview?.id) {
                throw new Error("createReview mutation returned empty payload");
            }
            (0, helper_1.mylog)(`Review created ${createdReview.id}`, "success");
            reply.send({
                status: "ok",
            });
        }
        catch (err) {
            server.log.error(err, "Failed to create review");
            if (err instanceof graphql_request_1.ClientError) {
                const graphError = err.response?.errors?.[0];
                const code = graphError?.extensions?.code;
                const message = graphError?.message || err.message || "Failed to create review";
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
exports.default = registerCreateReviewRoute;

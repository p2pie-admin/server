"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasTooManyReviews = void 0;
const callStrapi_1 = __importDefault(require("../../services/callStrapi"));
const queries_1 = require("../../services/queries");
const hasTooManyReviews = async (fingerprint, logger) => {
    try {
        const limit = +(process.env.ALLOWED_REVIEWS_PER_FINGERPRINT || 5) + 1;
        const existing = await (0, callStrapi_1.default)(queries_1.ReviewByFingerprintQuery, {
            fingerprint,
            limit,
        });
        const reviews = existing?.reviews;
        return (Array.isArray(reviews) &&
            reviews.length > +(process.env.ALLOWED_REVIEWS_PER_FINGERPRINT || 5));
    }
    catch (err) {
        logger.warn({ err, fingerprint }, "Failed to check review duplicates, skipping duplicate guard");
        return false;
    }
};
exports.hasTooManyReviews = hasTooManyReviews;

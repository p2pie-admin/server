import { FastifyBaseLogger } from "fastify";

import callStrapi from "../../services/callStrapi";
import { ReviewByFingerprintQuery } from "../../services/queries";

export const hasTooManyReviews = async (
  fingerprint: string,
  logger: FastifyBaseLogger
) => {
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
    logger.warn(
      { err, fingerprint },
      "Failed to check review duplicates, skipping duplicate guard"
    );
    return false;
  }
};

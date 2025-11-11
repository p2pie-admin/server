import { IReview } from "../../types/review";
import { ReviewMutationInput } from "./types";
import { pickString } from "./utils";

const REVIEW_TYPES: NonNullable<IReview["type"]>[] = [
  "positive",
  "neutral",
  "negative",
  "question",
];
const DEFAULT_REVIEW_TYPE: NonNullable<IReview["type"]> = "question";

export const buildReviewInput = (
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

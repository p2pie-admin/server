import { IReview } from "../../types/review";
import { ReviewInputMeta, ReviewMutationInput } from "./types";
import { pickString } from "./utils";

const REVIEW_TYPES: NonNullable<IReview["type"]>[] = [
  "positive",
  "neutral",
  "negative",
  "question",
];
const DEFAULT_REVIEW_TYPE: NonNullable<IReview["type"]> = "question";

type BuildReviewInputResult =
  | {
      data: ReviewMutationInput;
      meta: ReviewInputMeta;
      error?: undefined;
    }
  | {
    data?: undefined;
    meta?: undefined;
    error: string;
  };

export const buildReviewInput = (
  raw: Partial<IReview>
): BuildReviewInputResult => {
  const text = pickString(raw.text);
  const exchangerId = pickString(raw.exchangerId);
  const fingerprint = pickString(raw.fingerprint);

  if (!text || !exchangerId || !fingerprint) {
    return { error: "Text, exchanger, and fingerprint are required" };
  }

  const providedType =
    raw.type && REVIEW_TYPES.includes(raw.type)
      ? (raw.type as NonNullable<IReview["type"]>)
      : undefined;

  const payload: ReviewMutationInput = {
    text,
    exchanger: exchangerId,
    fingerprint,
    type: providedType ?? DEFAULT_REVIEW_TYPE,
  };

  if (typeof raw.isDispute === "boolean" || raw.isDispute === null) {
    payload.isDispute = raw.isDispute;
  }

  if (typeof raw.isExchangeDone === "boolean" || raw.isExchangeDone === null) {
    payload.isExchangeDone = raw.isExchangeDone;
  }

  const userAgent = pickString(raw.userAgent);
  if (userAgent) payload.userAgent = userAgent;

  const location = pickString(raw.location);
  if (location) payload.location = location;

  const gossip = pickString(raw.gossip);
  if (gossip) payload.gossip = gossip;

  const rawCategories = raw.review_categories;
  const categories = Array.isArray(
    (rawCategories as { connect?: unknown })?.connect
  )
    ? (rawCategories as { connect?: unknown }).connect
    : Array.isArray(rawCategories)
      ? rawCategories
      : undefined;

  const normalizeCategoryId = (value: unknown): string | null => {
    if (value && typeof value === "object" && "id" in value) {
      return normalizeCategoryId((value as { id: unknown }).id);
    }

    const strId = pickString(value);
    return strId ?? null;
  };

  const normalizedCategories = Array.isArray(categories)
    ? categories
        .map((categoryId) => normalizeCategoryId(categoryId))
        .filter((id): id is string => Boolean(id))
    : undefined;

  if (normalizedCategories?.length) {
    payload.review_categories = normalizedCategories;
  }

  const honeypot = pickString(raw.honeypot);
  if (honeypot) payload.honeypot = honeypot;

  return { data: payload, meta: { typeProvided: Boolean(providedType) } };
};

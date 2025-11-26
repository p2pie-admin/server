export type ReviewTone = "negative" | "positive" | "neutral" | "question";

export interface IReview {
  honeypot: string;
  text: string;
  exchangerId: string;
  type?: ReviewTone;
  isDispute?: boolean | null;
  isExchangeDone?: boolean | null;
  userAgent?: string;
  fingerprint?: string;
  location?: string;
  gossip?: string;
  ipAddress?: string;
  review_categories?: ReviewCategoriesPayload;
  ai_data?: Record<string, unknown> | null;
  pow?: PowPayload;
}

export interface IPrompt {
  code: string;
  description: string;
}

export interface IReviewCheckResponse {
  isApproved: boolean;
  comment: string;
  tone: ReviewTone;
  changedVersion?: string | null;
}

export type ReviewCategoriesPayload =
  | {
      connect: ({ id: string | number } | string | number)[];
    }
  | (string | number)[];

export type PowChallenge = {
  exchangerId: string;
  salt: string;
  issuedAt: number;
  difficulty: number;
};

export type PowPayload = {
  challenge: PowChallenge;
  nonce: number;
  difficulty: number;
};

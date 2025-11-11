export type ReviewTone = "negative" | "positive" | "neutral" | "question";

export interface IReview {
  honeypot: string;
  text: string;
  exchangerId: string;
  type?: ReviewTone;
  isDispute?: boolean | null;
  userAgent?: string;
  fingerprint?: string;
  location?: string;
  ai_data?: Record<string, unknown> | null;
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

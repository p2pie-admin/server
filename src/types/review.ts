export interface IReview {
  honeypot: string;
  text: string;
  exchangerId: string;
  type?: "positive" | "neutral" | "negative" | "question";
  isDispute?: boolean | null;
  userAgent?: string;
  fingerprint?: string;
  location?: string;
}

export interface IPrompt {
  code: string;
  description: string;
}

export interface IReviewCheckResponse {
  isApproved: boolean;
  comment: string;
  tone: "negative" | "positive" | "neutral" | "question";
}

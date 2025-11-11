import { FastifyRequest } from "fastify";

import { IReview, IReviewCheckResponse } from "../../types/review";

export type ReviewRequest = FastifyRequest<{
  Body: Partial<IReview>;
}>;

export type ReviewMutationInput = {
  text: string;
  exchanger: string;
  fingerprint: string;
  type: NonNullable<IReview["type"]>;
  isDispute?: boolean | null;
  userAgent?: string;
  location?: string;
  ipAddress?: string;
  honeypot?: string;
  ai_data?: IReviewCheckResponse;
  isApproved?: boolean;
};

export type ReviewInputMeta = {
  typeProvided: boolean;
};

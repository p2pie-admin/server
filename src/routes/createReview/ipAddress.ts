import { ReviewMutationInput, ReviewRequest } from "./types";
import { pickString } from "./utils";

export const attachIpAddress = (
  request: ReviewRequest,
  reviewInput: ReviewMutationInput
) => {
  const forwardedFor = request.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor;
  const forwardedIp = pickString(forwardedValue);

  if (forwardedIp) {
    reviewInput.ipAddress = forwardedIp.split(",")[0]?.trim();
  } else if (request.ip) {
    reviewInput.ipAddress = request.ip;
  }
};

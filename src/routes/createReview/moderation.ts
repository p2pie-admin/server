import { mylog } from "../../helper";
import { callGPT, findPrompt } from "../../services/gpt";
import { IReviewCheckResponse, ReviewTone } from "../../types/review";
import { ReviewMutationInput } from "./types";

export type ModerationResult = {
  approved: boolean;
  response: IReviewCheckResponse | null;
  rawResponse: unknown;
};

const ALLOWED_TONES: ReviewTone[] = ["negative", "positive", "neutral", "question"];

const isValidGptResponse = (
  payload: unknown
): payload is IReviewCheckResponse => {
  if (!payload || typeof payload !== "object") return false;
  const data = payload as Record<string, unknown>;
  return (
    typeof data.isApproved === "boolean" &&
    typeof data.comment === "string" &&
    typeof data.tone === "string" &&
    ALLOWED_TONES.includes(data.tone as ReviewTone) &&
    (typeof data.changedVersion === "string" ||
      data.changedVersion === null ||
      typeof data.changedVersion === "undefined")
  );
};

const parseGptResponse = (
  payload: unknown
): IReviewCheckResponse | null => {
  if (!payload) return null;

  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      return isValidGptResponse(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return isValidGptResponse(payload) ? (payload as IReviewCheckResponse) : null;
};

export const runModeration = async (
  reviewInput: ReviewMutationInput
): Promise<ModerationResult> => {
  const prompt = await findPrompt("review");
  if (!prompt) {
    throw new Error("no prompt found for review");
  }
  mylog("Prompt found", "success");

  const rawGptResponse = await callGPT(
    `${prompt} | Review text: ${reviewInput.text}`,
    `[${reviewInput.exchanger} review]`
  );

  const gptResponse = parseGptResponse(rawGptResponse);

  if (!gptResponse) {
    mylog(
      "GPT response could not be parsed as JSON, proceeding without moderation data",
      "warning"
    );
    return {
      approved: false,
      response: null as IReviewCheckResponse | null,
      rawResponse: rawGptResponse,
    };
  }

  if (!gptResponse.isApproved) {
    mylog(`not approved: ${JSON.stringify(gptResponse)}`, "warning");
  } else {
    mylog(`${JSON.stringify(gptResponse, undefined, 4)}`, "important");
  }
  return {
    approved: gptResponse.isApproved,
    response: gptResponse,
    rawResponse: rawGptResponse,
  };
};

import { mylog } from "../../helper";
import { callGPT, findPrompt } from "../../services/gpt";
import { IReviewCheckResponse } from "../../types/review";
import { ReviewMutationInput } from "./types";

const isValidGptResponse = (
  payload: unknown
): payload is IReviewCheckResponse => {
  if (!payload || typeof payload !== "object") return false;
  const data = payload as Record<string, unknown>;
  return (
    typeof data.isApproved === "boolean" &&
    typeof data.comment === "string" &&
    typeof data.tone === "string"
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

export const runModeration = async (reviewInput: ReviewMutationInput) => {
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
    return { approved: true, response: null as IReviewCheckResponse | null };
  }

  if (!gptResponse.isApproved) {
    mylog(`not approved: ${JSON.stringify(gptResponse)}`, "warning");
    return { approved: false, response: gptResponse };
  }

  mylog(`${JSON.stringify(gptResponse, undefined, 4)}`, "important");
  return { approved: true, response: gptResponse };
};

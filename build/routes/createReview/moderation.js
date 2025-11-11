"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runModeration = void 0;
const helper_1 = require("../../helper");
const gpt_1 = require("../../services/gpt");
const ALLOWED_TONES = ["negative", "positive", "neutral", "question"];
const isValidGptResponse = (payload) => {
    if (!payload || typeof payload !== "object")
        return false;
    const data = payload;
    return (typeof data.isApproved === "boolean" &&
        typeof data.comment === "string" &&
        typeof data.tone === "string" &&
        ALLOWED_TONES.includes(data.tone) &&
        (typeof data.changedVersion === "string" ||
            data.changedVersion === null ||
            typeof data.changedVersion === "undefined"));
};
const parseGptResponse = (payload) => {
    if (!payload)
        return null;
    if (typeof payload === "string") {
        try {
            const parsed = JSON.parse(payload);
            return isValidGptResponse(parsed) ? parsed : null;
        }
        catch {
            return null;
        }
    }
    return isValidGptResponse(payload) ? payload : null;
};
const runModeration = async (reviewInput) => {
    const prompt = await (0, gpt_1.findPrompt)("review");
    if (!prompt) {
        throw new Error("no prompt found for review");
    }
    (0, helper_1.mylog)("Prompt found", "success");
    const rawGptResponse = await (0, gpt_1.callGPT)(`${prompt} | Review text: ${reviewInput.text}`, `[${reviewInput.exchanger} review]`);
    const gptResponse = parseGptResponse(rawGptResponse);
    if (!gptResponse) {
        (0, helper_1.mylog)("GPT response could not be parsed as JSON, proceeding without moderation data", "warning");
        return {
            approved: false,
            response: null,
            rawResponse: rawGptResponse,
        };
    }
    if (!gptResponse.isApproved) {
        (0, helper_1.mylog)(`not approved: ${JSON.stringify(gptResponse)}`, "warning");
    }
    else {
        (0, helper_1.mylog)(`${JSON.stringify(gptResponse, undefined, 4)}`, "important");
    }
    return {
        approved: gptResponse.isApproved,
        response: gptResponse,
        rawResponse: rawGptResponse,
    };
};
exports.runModeration = runModeration;

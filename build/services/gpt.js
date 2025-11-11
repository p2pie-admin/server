"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPrompt = exports.callGPT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const openai_1 = __importDefault(require("openai"));
const helper_1 = require("../helper");
const callStrapi_1 = __importDefault(require("./callStrapi"));
const queries_1 = require("./queries");
dotenv_1.default.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key is missing. Please set OPENAI_API_KEY in .env.");
}
const openai = new openai_1.default({
    apiKey: OPENAI_API_KEY,
});
const callGPT = async (prompt, id) => {
    const model = process.env.MODEL || "gpt-4o-mini";
    console.log("Model: ", model);
    if (!prompt)
        return null;
    const maxRetries = 3;
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            const completion = await openai.chat.completions.create({
                model,
                messages: [{ role: "user", content: prompt.slice(0, 320000) }],
            });
            const rawResult = completion?.choices?.[0]?.message?.content;
            if (rawResult) {
                const cleaned = rawResult.replace(/^```json\s*|```$/g, "").trim();
                const parsed = JSON.parse(cleaned);
                return parsed;
            }
        }
        catch (error) {
            (0, helper_1.mylog)(`❌ Error processing ${id} (Attempt ${attempts + 1} of ${maxRetries}): ${error}`, "error");
        }
        attempts++;
        if (attempts < maxRetries) {
            console.log(`🔄 Retrying in 5 seconds...`);
            await (0, helper_1.waitSec)(5000);
        }
    }
    (0, helper_1.mylog)(`❌ ${id} failed after ${maxRetries} attempts.`, "error");
    return null;
};
exports.callGPT = callGPT;
/////////////////////////////////////////////////////////
const findPrompt = async (name, idx = 0) => {
    const promptData = (await (0, callStrapi_1.default)(queries_1.PromptsQuery));
    let additionalDescription = "";
    const promptDescription = promptData?.prompts?.find((p) => p.code.toLowerCase() == name)?.description;
    if (idx) {
        additionalDescription = promptData?.prompts?.find((p) => p.code.toLowerCase() == `${name}_${idx}`)?.description;
    }
    if (promptDescription) {
        (0, helper_1.mylog)(`${name} prompt found`, "info");
        return `${promptDescription} | ${additionalDescription}`;
    }
    (0, helper_1.mylog)(`${name} no prompt found`, "error");
    return;
};
exports.findPrompt = findPrompt;

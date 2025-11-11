"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildReviewInput = void 0;
const utils_1 = require("./utils");
const REVIEW_TYPES = [
    "positive",
    "neutral",
    "negative",
    "question",
];
const DEFAULT_REVIEW_TYPE = "question";
const buildReviewInput = (raw) => {
    const text = (0, utils_1.pickString)(raw.text);
    const exchangerId = (0, utils_1.pickString)(raw.exchangerId);
    const fingerprint = (0, utils_1.pickString)(raw.fingerprint);
    if (!text || !exchangerId || !fingerprint) {
        return { error: "Text, exchanger, and fingerprint are required" };
    }
    const providedType = raw.type && REVIEW_TYPES.includes(raw.type)
        ? raw.type
        : undefined;
    const payload = {
        text,
        exchanger: exchangerId,
        fingerprint,
        type: providedType ?? DEFAULT_REVIEW_TYPE,
    };
    if (typeof raw.isDispute === "boolean" || raw.isDispute === null) {
        payload.isDispute = raw.isDispute;
    }
    const userAgent = (0, utils_1.pickString)(raw.userAgent);
    if (userAgent)
        payload.userAgent = userAgent;
    const location = (0, utils_1.pickString)(raw.location);
    if (location)
        payload.location = location;
    const honeypot = (0, utils_1.pickString)(raw.honeypot);
    if (honeypot)
        payload.honeypot = honeypot;
    return { data: payload, meta: { typeProvided: Boolean(providedType) } };
};
exports.buildReviewInput = buildReviewInput;

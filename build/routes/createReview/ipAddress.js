"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachIpAddress = void 0;
const utils_1 = require("./utils");
const attachIpAddress = (request, reviewInput) => {
    const forwardedFor = request.headers["x-forwarded-for"];
    const forwardedValue = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor;
    const forwardedIp = (0, utils_1.pickString)(forwardedValue);
    if (forwardedIp) {
        reviewInput.ipAddress = forwardedIp.split(",")[0]?.trim();
    }
    else if (request.ip) {
        reviewInput.ipAddress = request.ip;
    }
};
exports.attachIpAddress = attachIpAddress;

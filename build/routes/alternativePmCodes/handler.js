"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alternativePmCodesHandler = void 0;
const redis_1 = require("../../redis");
const alternativePmCodesHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const alternative_pm_codes = await (0, redis_1.getData)("alternative_pm_codes");
    return reply.send(JSON.stringify(alternative_pm_codes));
};
exports.alternativePmCodesHandler = alternativePmCodesHandler;

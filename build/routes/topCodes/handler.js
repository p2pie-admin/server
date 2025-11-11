"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topCodesHandler = void 0;
const redis_1 = require("../../redis");
const topCodesHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const topCodes = await (0, redis_1.getData)("top_codes");
    return reply.send(topCodes);
};
exports.topCodesHandler = topCodesHandler;

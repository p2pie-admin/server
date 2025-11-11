"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangerStatsHandler = void 0;
const redis_1 = require("../../redis");
const exchangerStatsHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const stats = await (0, redis_1.getObject)("exchanger_stats");
    reply.send(JSON.stringify(stats));
};
exports.exchangerStatsHandler = exchangerStatsHandler;

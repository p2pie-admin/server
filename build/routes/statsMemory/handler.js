"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsMemoryHandler = void 0;
const redis_1 = require("../../redis");
const statsMemoryHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const memoryUsage = await (0, redis_1.getData)("stats:memory_usage");
    reply.send(JSON.stringify(memoryUsage));
};
exports.statsMemoryHandler = statsMemoryHandler;

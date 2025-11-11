"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsHandler = void 0;
const redis_1 = require("../../redis");
const statsHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const workerStats = await (0, redis_1.getObject)("stats");
    reply.send(JSON.stringify(workerStats));
};
exports.statsHandler = statsHandler;

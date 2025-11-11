"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangersHandler = void 0;
const redis_1 = require("../../redis");
const exchangersHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const exchangers = await (0, redis_1.getObject)("exchangers");
    reply.send(JSON.stringify(exchangers && Object.keys(exchangers).length
        ? exchangers
        : "no active exchangers!"));
};
exports.exchangersHandler = exchangersHandler;

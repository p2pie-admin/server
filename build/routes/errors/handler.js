"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorsHandler = void 0;
const redis_1 = require("../../redis");
const errorsHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.send(JSON.stringify(await (0, redis_1.getData)("errors")));
};
exports.errorsHandler = errorsHandler;

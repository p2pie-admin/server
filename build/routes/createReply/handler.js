"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReplyOptionsHandler = exports.createReplyHandler = void 0;
const createReplyHandler = async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    request.server.log.info({ reviewReply: request.body }, "Received /createReply payload");
    reply.send({ status: "ok" });
};
exports.createReplyHandler = createReplyHandler;
const createReplyOptionsHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
    reply.status(204).send();
};
exports.createReplyOptionsHandler = createReplyOptionsHandler;

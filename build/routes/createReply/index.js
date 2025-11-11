"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerCreateReplyRoute = (server) => {
    server.post("/createReply", handler_1.createReplyHandler);
    server.options("/createReply", handler_1.createReplyOptionsHandler);
};
exports.default = registerCreateReplyRoute;

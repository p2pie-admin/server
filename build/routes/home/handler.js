"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.homeHandler = void 0;
const homeHandler = (_, reply) => {
    reply.sendFile("index.html");
};
exports.homeHandler = homeHandler;

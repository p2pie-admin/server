"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerTopRoute = (server) => {
    server.get("/top", handler_1.topHandler);
};
exports.default = registerTopRoute;

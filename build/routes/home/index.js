"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerHomeRoute = (server) => {
    server.get("/", handler_1.homeHandler);
};
exports.default = registerHomeRoute;

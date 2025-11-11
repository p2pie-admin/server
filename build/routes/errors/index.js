"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerErrorsRoute = (server) => {
    server.get("/errors", handler_1.errorsHandler);
};
exports.default = registerErrorsRoute;

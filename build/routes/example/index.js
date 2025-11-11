"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerExampleRoute = (server) => {
    server.get("/example", handler_1.exampleHandler);
};
exports.default = registerExampleRoute;

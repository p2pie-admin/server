"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerExchangersRoute = (server) => {
    server.get("/exchangers", handler_1.exchangersHandler);
};
exports.default = registerExchangersRoute;

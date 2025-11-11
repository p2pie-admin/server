"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerStatsRoute = (server) => {
    server.get("/stats", handler_1.statsHandler);
};
exports.default = registerStatsRoute;

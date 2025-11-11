"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerStatsMemoryRoute = (server) => {
    server.get("/stats/memory_usage", handler_1.statsMemoryHandler);
};
exports.default = registerStatsMemoryRoute;

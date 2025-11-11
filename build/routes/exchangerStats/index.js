"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerExchangerStatsRoute = (server) => {
    server.get("/exchanger_stats", handler_1.exchangerStatsHandler);
};
exports.default = registerExchangerStatsRoute;

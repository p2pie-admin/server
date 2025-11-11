"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerDirRatesRoute = (server) => {
    server.get("/dir=:code/:type/:city?", handler_1.dirRatesHandler);
};
exports.default = registerDirRatesRoute;

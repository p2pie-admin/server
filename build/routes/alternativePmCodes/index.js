"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerAlternativePmCodesRoute = (server) => {
    server.get("/alternative_pm_codes", handler_1.alternativePmCodesHandler);
};
exports.default = registerAlternativePmCodesRoute;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerTopCodesRoute = (server) => {
    server.get("/top_codes", handler_1.topCodesHandler);
};
exports.default = registerTopCodesRoute;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerParserSettingRoute = (server) => {
    server.get("/parser_setting", handler_1.parserSettingHandler);
};
exports.default = registerParserSettingRoute;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parserSettingHandler = void 0;
const redis_1 = require("../../redis");
const parserSettingHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const parserSetting = (await (0, redis_1.getData)("parser_setting"));
    return reply.send(JSON.stringify(parserSetting));
};
exports.parserSettingHandler = parserSettingHandler;

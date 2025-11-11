"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allPmCodesHandler = void 0;
const redis_1 = require("../../redis");
const allPmCodesHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const all_pm_codes_that_exist = await (0, redis_1.getData)("all_pm_codes_that_exist");
    return reply.send(all_pm_codes_that_exist);
};
exports.allPmCodesHandler = allPmCodesHandler;

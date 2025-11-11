"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topHandler = void 0;
const helper_1 = require("../../helper");
const manyRates_1 = require("../../manyRates");
const topHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const bestRates = await (0, helper_1.toCache)({
        key: "top",
        ttl: 60 * 1000,
        getData: async () => await (0, manyRates_1.getPopularRates)(),
    });
    reply.send(JSON.stringify(bestRates));
};
exports.topHandler = topHandler;

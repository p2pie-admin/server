"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dirsHandler = void 0;
const helper_1 = require("../../helper");
const redis_1 = require("../../redis");
const dirsHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const dirs = await (0, helper_1.toCache)({
        key: "dirs",
        ttl: 60 * 1000,
        getData: async () => {
            const allRatesID = (await (0, redis_1.getObject)("allRatesID"));
            if (!allRatesID)
                return {};
            const dirRatesMin = (0, helper_1.getDirRatesMin)();
            const totalRatesByDir = Object.entries(allRatesID).reduce((res, [code, entries]) => {
                const total = (0, helper_1.extractOrderedRateIds)(entries).length;
                if (total >= dirRatesMin) {
                    res = { ...res, [code]: total };
                }
                return res;
            }, {});
            const sortedArray = Object.entries(totalRatesByDir)
                .sort(([, valueA], [, valueB]) => valueA - valueB)
                .reverse();
            return Object.fromEntries(sortedArray);
        },
    });
    reply.send(JSON.stringify(dirs));
};
exports.dirsHandler = dirsHandler;

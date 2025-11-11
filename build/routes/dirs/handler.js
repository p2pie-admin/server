"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dirsHandler = void 0;
const helper_1 = require("../../helper");
const redis_1 = require("../../redis");
const dirsHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const dirs = await (0, helper_1.toCache)({
        key: "dirs",
        getData: async () => {
            const allDirtyRates = (await (0, redis_1.getObject)("allDirtyRates"));
            const totalRatesByDir = Object.entries(allDirtyRates).reduce((res, [code, dirRate]) => {
                res = { ...res, [code]: Object.keys(dirRate).length };
                return res;
            }, {});
            const sortedArray = Object.entries(totalRatesByDir)
                .filter(([, value]) => value > Number(process.env.DIR_RATES_MIN || "3"))
                .sort(([, valueA], [, valueB]) => valueA - valueB)
                .reverse();
            return Object.fromEntries(sortedArray);
        },
    });
    reply.send(JSON.stringify(dirs));
};
exports.dirsHandler = dirsHandler;

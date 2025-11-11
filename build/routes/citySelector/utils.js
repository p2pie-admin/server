"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCitySelector = void 0;
const redis_1 = require("../../redis");
const helper_1 = require("../../helper");
const getCitySelector = async (dir) => {
    return (0, helper_1.toCache)({
        key: `city_selector:${dir ?? "all"}`,
        ttl: 2 * 60 * 60 * 1000,
        getData: async () => {
            const cities = (await (0, redis_1.getData)("parser_setting"))?.cities;
            const allDirtyRates = (await (0, redis_1.getObject)("allDirtyRates"));
            return (0, helper_1.convertCitiesToSelector)(dir, cities, allDirtyRates);
        },
    });
};
exports.getCitySelector = getCitySelector;

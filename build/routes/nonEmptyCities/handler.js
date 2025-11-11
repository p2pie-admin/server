"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nonEmptyCitiesHandler = void 0;
const redis_1 = require("../../redis");
const nonEmptyCitiesHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const cities = (await (0, redis_1.getData)("parser_setting"))?.cities;
    if (!cities) {
        reply.send(null);
        return;
    }
    const allDirtyRates = (await (0, redis_1.getObject)("allDirtyRates"));
    const nonEmpty = cities.reduce((res, city) => {
        const dirRatesTotal = Object.entries(allDirtyRates).reduce((innerRes, [dir, dirRates]) => {
            const totalByCity = Object.values(dirRates).filter((r) => r.cityRates &&
                Object.keys(r.cityRates).find((cen) => cen.toLowerCase() == city?.en_name.toLowerCase())).length;
            return totalByCity ? { ...innerRes, [dir]: totalByCity } : innerRes;
        }, {});
        return Object.keys(dirRatesTotal).length
            ? { ...res, [city.en_name.toLowerCase()]: dirRatesTotal }
            : res;
    }, {});
    reply.send(JSON.stringify(nonEmpty));
};
exports.nonEmptyCitiesHandler = nonEmptyCitiesHandler;

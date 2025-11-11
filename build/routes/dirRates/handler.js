"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dirRatesHandler = void 0;
const helper_1 = require("../../helper");
const dirRatesHandler = async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const params = request.params;
    const code = params.code.toUpperCase();
    const city = params.city?.toLowerCase();
    const type = params.type;
    const rates = await (0, helper_1.toCache)({
        key: `rates_${code}_${city || "no-city"}_${type}`,
        ttl: 30 * 1000,
        getData: async () => {
            const cleanDirRates = await (0, helper_1.getCleanDirRates)(code);
            if (!cleanDirRates)
                return [];
            const newRates = Object.values(cleanDirRates);
            if (!city) {
                return newRates;
            }
            const cityKey = city.toLowerCase();
            return newRates.reduce((res, rate) => {
                const cityRateEntry = rate.cityRates?.[cityKey];
                if (!cityRateEntry)
                    return res;
                const cityRateData = typeof cityRateEntry === "object" && cityRateEntry !== null
                    ? cityRateEntry
                    : undefined;
                const normalizedEntry = cityRateData && "rate" in cityRateData && cityRateData.rate
                    ? { ...cityRateData }
                    : { rate: cityRateEntry };
                const sanitizedRate = {
                    ...rate,
                    cityRates: {
                        [cityKey]: normalizedEntry,
                    },
                };
                return [...res, sanitizedRate];
            }, []);
        },
    });
    reply.send(JSON.stringify(rates));
};
exports.dirRatesHandler = dirRatesHandler;

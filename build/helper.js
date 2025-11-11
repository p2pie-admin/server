"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitSec = exports.sleep = exports.mylog = exports.getCleanDirRates = exports.extractOrderedRateIds = exports.toCache = exports.convertCitiesToSelector = void 0;
const redis_1 = require("./redis");
const index_1 = require("./index");
const countryWeights = {
    Russia: 5,
    Turkey: 2,
    Ukraine: 4,
    Belarus: 4,
    Kazakhstan: 3,
    Azerbaijan: 3,
    Armenia: 2,
    Uzbekistan: 2,
};
function convertCitiesToSelector(dir, cities, allDirtyRates) {
    const groupedByCountry = {};
    if (!cities || !allDirtyRates)
        return [];
    const relevantDirKeys = dir ? [dir] : Object.keys(allDirtyRates);
    const cityRateCounts = new Map();
    for (const dirKey of relevantDirKeys) {
        const dirRates = allDirtyRates[dirKey];
        if (!dirRates)
            continue;
        for (const rate of Object.values(dirRates)) {
            const cityRates = rate?.cityRates;
            if (!cityRates || typeof cityRates !== "object")
                continue;
            for (const cityName of Object.keys(cityRates)) {
                const normalizedName = cityName?.trim().toLowerCase();
                if (!normalizedName)
                    continue;
                cityRateCounts.set(normalizedName, (cityRateCounts.get(normalizedName) || 0) + 1);
            }
        }
    }
    for (const city of cities) {
        const normalizedName = city.en_name.trim().toLowerCase();
        const totalCityRates = cityRateCounts.get(normalizedName) ?? 0;
        if (totalCityRates < 2)
            continue; // убираем одиночек
        const countryKey = `${city.en_country_name}-${city.ru_country_name}`;
        if (!groupedByCountry[countryKey]) {
            groupedByCountry[countryKey] = {
                en_country_name: city.en_country_name,
                ru_country_name: city.ru_country_name,
                weight: countryWeights[city.en_country_name] || 1,
                cities: [],
            };
        }
        groupedByCountry[countryKey].cities.push({
            en_name: city.en_name,
            ru_name: city.ru_name,
            population: city.population,
            totalCityRates,
        });
    }
    return Object.values(groupedByCountry);
}
exports.convertCitiesToSelector = convertCitiesToSelector;
// export const setCacheData = ({
//   cache,
//   key,
//   data,
// }: {
//   cache: Map<any, any>;
//   key: string;
//   data: any;
// }) => {
//   const now = Date.now();
//   cache.set(key, { data, timestamp: now });
// };
// функция кэширует чтобы не делать обращение к базе и не делать вычислений многократно
const toCache = async ({ key, ttl = 60 * 1000, getData, }) => {
    const now = Date.now();
    if (index_1.cache.has(key)) {
        const cached = index_1.cache.get(key);
        if (now - cached.timestamp < ttl) {
            return cached.data; // Return cached response
        }
    }
    const data = await getData();
    index_1.cache.set(key, { data, timestamp: now });
    console.log(`Set cache: ${key} | ${ttl / 1000}s`);
    return data;
};
exports.toCache = toCache;
const extractOrderedRateIds = (ratesID) => {
    if (!Array.isArray(ratesID))
        return [];
    const seen = new Set();
    const normalized = [];
    for (const entry of ratesID) {
        if (!entry || typeof entry !== "object")
            continue;
        const record = entry;
        for (const [rawId, rawTags] of Object.entries(record)) {
            const id = rawId?.trim();
            if (!id || seen.has(id))
                continue;
            const tags = Array.isArray(rawTags)
                ? rawTags.filter((tag) => typeof tag === "string")
                : [];
            normalized.push({ id, tags });
            seen.add(id);
        }
    }
    return normalized;
};
exports.extractOrderedRateIds = extractOrderedRateIds;
const getCleanDirRates = async (dir) => {
    const dirtyDirRates = (await (0, redis_1.getObject)(`allDirtyRates:${dir}`));
    const ratesID = (await (0, redis_1.getData)(`allRatesID:${dir}`));
    if (!dirtyDirRates) {
        return [];
    }
    const normalizedIds = (0, exports.extractOrderedRateIds)(ratesID);
    const parameterCodesMap = new Map();
    for (const { id, tags } of normalizedIds) {
        parameterCodesMap.set(id, [...tags]);
    }
    const attachParameterCodes = (id, rate) => {
        if (!parameterCodesMap.has(id)) {
            return rate;
        }
        const codes = parameterCodesMap.get(id) ?? [];
        return {
            ...rate,
            parameterCodes: [...codes],
        };
    };
    if (!normalizedIds.length) {
        return Object.entries(dirtyDirRates).map(([id, rate]) => attachParameterCodes(id, rate));
    }
    const collected = [];
    const used = new Set();
    for (const { id } of normalizedIds) {
        const rate = dirtyDirRates[id];
        if (!rate)
            continue;
        collected.push(attachParameterCodes(id, rate));
        used.add(id);
    }
    if (collected.length < Object.keys(dirtyDirRates).length) {
        for (const [id, rate] of Object.entries(dirtyDirRates)) {
            if (used.has(id))
                continue;
            collected.push(attachParameterCodes(id, rate));
        }
    }
    return collected;
};
exports.getCleanDirRates = getCleanDirRates;
const mylog = (message, color = "info") => {
    const colors = {
        error: "📕 \u001b[1;31m",
        success: "📗 \u001b[1;32m",
        warning: "📙 \u001b[1;33m",
        info: "📘 \u001b[1;34m",
        hidden: "📓 \u001b[1;30m",
        important: "📔 \u001b[38;5;226m",
    };
    console.log(`${colors[color]} ${message}`);
};
exports.mylog = mylog;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
const waitSec = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));
exports.waitSec = waitSec;

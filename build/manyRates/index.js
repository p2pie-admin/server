"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPopularRates = exports.getSimilarRates = void 0;
const helper_1 = require("../helper");
const redis_1 = require("../redis");
const normalizeCityRate = (entry) => {
    if (typeof entry === "object" && entry !== null) {
        const normalized = entry;
        if (normalized.rate && typeof normalized.rate === "object") {
            return normalized.rate;
        }
        return normalized;
    }
    return null;
};
const isCashDir = (dir) => dir
    .split("_")
    .some((part) => typeof part === "string" && part.toUpperCase().includes("CASH"));
const withCityForCashDir = (rates, dir, city) => {
    if (!city || !isCashDir(dir))
        return rates;
    const cityKey = city.toLowerCase();
    return rates.reduce((acc, rate) => {
        const cityRate = normalizeCityRate(rate.cityRates?.[cityKey]);
        if (!cityRate)
            return acc;
        acc.push({
            ...rate,
            ...cityRate,
            cityRates: rate.cityRates ? { [cityKey]: rate.cityRates[cityKey] } : undefined,
        });
        return acc;
    }, []);
};
const findBestRateByDir = async (dir, fiatIndex) => {
    const cleanDirRates = await (0, helper_1.getCleanDirRates)(dir);
    if (!cleanDirRates.length)
        return;
    const [bestRate] = [...cleanDirRates].sort((rateA, rateB) => rateA.course - rateB.course);
    if (!bestRate)
        return;
    const course = fiatIndex && bestRate.course !== 0 ? 1 / bestRate.course : bestRate.course;
    const best = {
        exchangerId: bestRate.exchangerId,
        course,
        fiat: dir.split("_")[fiatIndex],
    };
    return best;
};
const getSimilarRates = async (dirs, city) => {
    const results = await Promise.all(dirs.map((dir) => findBestCourseByDir(dir, city)));
    return results;
};
exports.getSimilarRates = getSimilarRates;
const findBestCourseByDir = async (dir, city) => {
    const cleanDirRates = withCityForCashDir(await (0, helper_1.getCleanDirRates)(dir), dir, city);
    if (!cleanDirRates.length)
        return;
    const [bestRate] = [...cleanDirRates].sort((rateA, rateB) => rateA.course - rateB.course);
    if (!bestRate)
        return;
    return [bestRate.course, cleanDirRates.length];
};
const getPopularRates = async () => {
    const popularDirs = (await (0, redis_1.getData)("popular_dirs"));
    const res = await Object.entries(popularDirs).reduce(async (accPromise, [cryptoCode, sides]) => {
        const acc = await accPromise;
        const [buyCourses, sellCourses] = await Promise.all([
            Promise.all(sides.buy.map((dir) => findBestRateByDir(dir, 0))),
            Promise.all(sides.sell.map((dir) => findBestRateByDir(dir, 1))),
        ]);
        return { ...acc, [cryptoCode]: { buy: buyCourses, sell: sellCourses } };
    }, Promise.resolve({}));
    //console.log(JSON.stringify(res, undefined, 4));
    return res;
};
exports.getPopularRates = getPopularRates;

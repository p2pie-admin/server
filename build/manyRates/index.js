"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPopularRates = exports.getSimilarRates = void 0;
const helper_1 = require("../helper");
const redis_1 = require("../redis");
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
const getSimilarRates = async (dirs) => {
    const results = await Promise.all(dirs.map((dir) => findBestCourseByDir(dir)));
    return results;
};
exports.getSimilarRates = getSimilarRates;
const findBestCourseByDir = async (dir) => {
    const cleanDirRates = await (0, helper_1.getCleanDirRates)(dir);
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

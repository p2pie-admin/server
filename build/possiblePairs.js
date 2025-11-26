"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("./helper");
const redis_1 = require("./redis");
const getPossiblePairs = async ({ code, side, }) => {
    const dirRatesMin = (0, helper_1.getDirRatesMin)();
    const allRatesID = (await (0, redis_1.getObject)("allRatesID"));
    if (!allRatesID) {
        (0, helper_1.mylog)("[dirsExistHandler] No dirs exist yet!", "warning");
        return;
    }
    const possiblePairs = {};
    for (const dir in allRatesID) {
        const entries = allRatesID[dir];
        const ids = (0, helper_1.extractOrderedRateIds)(entries);
        if (!ids.length || ids.length < dirRatesMin)
            continue;
        const [leftPm, rightPm] = dir.split("_");
        if (!leftPm || !rightPm)
            continue;
        // Filter by side + code if provided
        if (side === "give" && leftPm !== code)
            continue;
        if (side === "get" && rightPm !== code)
            continue;
        if (side === "give") {
            if (!possiblePairs[leftPm])
                possiblePairs[leftPm] = [];
            possiblePairs[leftPm].push(rightPm);
        }
        else {
            if (!possiblePairs[rightPm])
                possiblePairs[rightPm] = [];
            possiblePairs[rightPm].push(leftPm);
        }
    }
    // If code was specified, just return the array for that code
    if (code) {
        return possiblePairs[code] ?? [];
    }
    return possiblePairs;
};
exports.default = getPossiblePairs;

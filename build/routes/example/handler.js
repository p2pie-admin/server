"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleHandler = void 0;
const redis_1 = require("../../redis");
const exampleHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const keys = await (0, redis_1.getKeys)();
    const exampleData = await Promise.all(keys.map(async (key) => {
        const value = await (0, redis_1.getObject)(key);
        let sample;
        if (Array.isArray(value)) {
            sample = value[0];
        }
        else if (value && typeof value === "object") {
            sample = (0, redis_1.getFirstObjectEntry)(value);
        }
        else {
            sample = value;
        }
        return { key, sample };
    }));
    reply.send(exampleData);
};
exports.exampleHandler = exampleHandler;

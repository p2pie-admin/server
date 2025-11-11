"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.citiesHandler = void 0;
const redis_1 = require("../../redis");
const citiesHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const cities = (await (0, redis_1.getData)("parser_setting"))?.cities;
    reply.send(JSON.stringify(cities));
};
exports.citiesHandler = citiesHandler;

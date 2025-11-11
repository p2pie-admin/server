"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cityByNameHandler = void 0;
const redis_1 = require("../../redis");
const cityByNameHandler = async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const { name } = request.params;
    const cities = (await (0, redis_1.getData)("parser_setting"))?.cities;
    if (!cities) {
        reply.send(null);
        return;
    }
    reply.send(JSON.stringify(cities?.find((c) => c.en_name.toLowerCase() == name.toLowerCase())));
};
exports.cityByNameHandler = cityByNameHandler;

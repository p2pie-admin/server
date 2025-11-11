"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.citySelectorHandler = void 0;
const utils_1 = require("./utils");
const citySelectorHandler = async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const citySelector = await (0, utils_1.getCitySelector)();
    reply.send(JSON.stringify(citySelector));
};
exports.citySelectorHandler = citySelectorHandler;

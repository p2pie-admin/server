"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.citySelectorByDirHandler = void 0;
const utils_1 = require("../citySelector/utils");
const citySelectorByDirHandler = async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const { dir } = request.params;
    const citySelector = await (0, utils_1.getCitySelector)(dir);
    reply.send(JSON.stringify(citySelector));
};
exports.citySelectorByDirHandler = citySelectorByDirHandler;

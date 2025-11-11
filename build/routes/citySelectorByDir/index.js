"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerCitySelectorByDirRoute = (server) => {
    server.get("/city_selector=:dir", handler_1.citySelectorByDirHandler);
};
exports.default = registerCitySelectorByDirRoute;

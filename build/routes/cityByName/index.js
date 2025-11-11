"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerCityByNameRoute = (server) => {
    server.get("/city=:name", handler_1.cityByNameHandler);
};
exports.default = registerCityByNameRoute;

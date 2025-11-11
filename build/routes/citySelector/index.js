"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerCitySelectorRoute = (server) => {
    server.get("/city_selector", handler_1.citySelectorHandler);
};
exports.default = registerCitySelectorRoute;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerCitiesRoute = (server) => {
    server.get("/cities", handler_1.citiesHandler);
};
exports.default = registerCitiesRoute;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerNonEmptyCitiesRoute = (server) => {
    server.get("/non_empty_cities", handler_1.nonEmptyCitiesHandler);
};
exports.default = registerNonEmptyCitiesRoute;

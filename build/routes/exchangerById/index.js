"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerExchangerByIdRoute = (server) => {
    server.get("/exchanger=:idOrName", handler_1.exchangerByIdHandler);
};
exports.default = registerExchangerByIdRoute;

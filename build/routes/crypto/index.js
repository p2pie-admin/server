"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerCryptoRoute = (server) => {
    server.get("/crypto=:code/:currency/:side", handler_1.cryptoHandler);
};
exports.default = registerCryptoRoute;

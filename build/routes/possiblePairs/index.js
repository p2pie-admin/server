"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerPossiblePairsRoute = (server) => {
    server.get("/possible_pairs/:side/:code", handler_1.possiblePairsHandler);
};
exports.default = registerPossiblePairsRoute;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerSimilarDirsRoute = (server) => {
    server.get("/similar/dirs=:dirsString", handler_1.similarDirsHandler);
};
exports.default = registerSimilarDirsRoute;

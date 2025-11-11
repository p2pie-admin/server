"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerDirsRoute = (server) => {
    server.get("/dirs", handler_1.dirsHandler);
};
exports.default = registerDirsRoute;

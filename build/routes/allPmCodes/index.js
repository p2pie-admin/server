"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("./handler");
const registerAllPmCodesRoute = (server) => {
    server.get("/all_pm_codes_that_exist", handler_1.allPmCodesHandler);
};
exports.default = registerAllPmCodesRoute;

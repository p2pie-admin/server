"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.similarDirsHandler = void 0;
const manyRates_1 = require("../../manyRates");
const similarDirsHandler = async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const { dirsString } = request.params;
    const dirs = dirsString.split(",");
    if (!dirs || !dirs.length) {
        reply.send("wrong dirs, try /similar/dirs=BTC_SBERRUB,BTC_TCSBRUB");
        return;
    }
    reply.send(JSON.stringify(await (0, manyRates_1.getSimilarRates)(dirs)));
};
exports.similarDirsHandler = similarDirsHandler;

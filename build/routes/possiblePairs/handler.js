"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.possiblePairsHandler = void 0;
const helper_1 = require("../../helper");
const possiblePairs_1 = __importDefault(require("../../possiblePairs"));
const possiblePairsHandler = async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const param = request.params;
    const code = param.code.toUpperCase();
    const side = param.side;
    const possiblePairs = await (0, helper_1.toCache)({
        key: `possible_pairs_${side}_${code}`,
        ttl: 600 * 1000,
        getData: async () => (0, possiblePairs_1.default)({ side, code }),
    });
    return reply.send(JSON.stringify(possiblePairs));
};
exports.possiblePairsHandler = possiblePairsHandler;

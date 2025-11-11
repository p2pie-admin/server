"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const home_1 = __importDefault(require("./home"));
const example_1 = __importDefault(require("./example"));
const createReply_1 = __importDefault(require("./createReply"));
const dirRates_1 = __importDefault(require("./dirRates"));
const topCodes_1 = __importDefault(require("./topCodes"));
const allPmCodes_1 = __importDefault(require("./allPmCodes"));
const alternativePmCodes_1 = __importDefault(require("./alternativePmCodes"));
const parserSetting_1 = __importDefault(require("./parserSetting"));
const exchangers_1 = __importDefault(require("./exchangers"));
const exchangerById_1 = __importDefault(require("./exchangerById"));
const errors_1 = __importDefault(require("./errors"));
const exchangerStats_1 = __importDefault(require("./exchangerStats"));
const stats_1 = __importDefault(require("./stats"));
const statsMemory_1 = __importDefault(require("./statsMemory"));
const citySelector_1 = __importDefault(require("./citySelector"));
const citySelectorByDir_1 = __importDefault(require("./citySelectorByDir"));
const cities_1 = __importDefault(require("./cities"));
const nonEmptyCities_1 = __importDefault(require("./nonEmptyCities"));
const cityByName_1 = __importDefault(require("./cityByName"));
const dirs_1 = __importDefault(require("./dirs"));
const possiblePairs_1 = __importDefault(require("./possiblePairs"));
const similarDirs_1 = __importDefault(require("./similarDirs"));
const top_1 = __importDefault(require("./top"));
const crypto_1 = __importDefault(require("./crypto"));
const registerGeneralRoutes = (server) => {
    const registerFns = [
        home_1.default,
        example_1.default,
        createReply_1.default,
        dirRates_1.default,
        topCodes_1.default,
        allPmCodes_1.default,
        alternativePmCodes_1.default,
        parserSetting_1.default,
        exchangers_1.default,
        exchangerById_1.default,
        errors_1.default,
        exchangerStats_1.default,
        stats_1.default,
        statsMemory_1.default,
        citySelector_1.default,
        citySelectorByDir_1.default,
        cities_1.default,
        nonEmptyCities_1.default,
        cityByName_1.default,
        dirs_1.default,
        possiblePairs_1.default,
        similarDirs_1.default,
        top_1.default,
        crypto_1.default,
    ];
    registerFns.forEach((registerFn) => registerFn(server));
};
exports.default = registerGeneralRoutes;

import { FastifyInstance } from "fastify";

import registerHomeRoute from "./home";
import registerExampleRoute from "./example";
import registerCreateReplyRoute from "./createReply";
import registerDirRatesRoute from "./dirRates";
import registerTopCodesRoute from "./topCodes";
import registerAllPmCodesRoute from "./allPmCodes";
import registerAlternativePmCodesRoute from "./alternativePmCodes";
import registerParserSettingRoute from "./parserSetting";
import registerExchangersRoute from "./exchangers";
import registerExchangerByIdRoute from "./exchangerById";
import registerErrorsRoute from "./errors";
import registerExchangerStatsRoute from "./exchangerStats";
import registerStatsRoute from "./stats";
import registerStatsMemoryRoute from "./statsMemory";
import registerCitySelectorRoute from "./citySelector";
import registerCitySelectorByDirRoute from "./citySelectorByDir";
import registerCitiesRoute from "./cities";
import registerNonEmptyCitiesRoute from "./nonEmptyCities";
import registerCityByNameRoute from "./cityByName";
import registerDirsRoute from "./dirs";
import registerPossiblePairsRoute from "./possiblePairs";
import registerSimilarDirsRoute from "./similarDirs";
import registerTopRoute from "./top";
import registerCryptoRoute from "./crypto";
import registerHistoryRoute from "./history";

const registerGeneralRoutes = (server: FastifyInstance) => {
  const registerFns = [
    registerHistoryRoute,
    registerHomeRoute,
    registerExampleRoute,
    registerCreateReplyRoute,
    registerDirRatesRoute,
    registerTopCodesRoute,
    registerAllPmCodesRoute,
    registerAlternativePmCodesRoute,
    registerParserSettingRoute,
    registerExchangersRoute,
    registerExchangerByIdRoute,
    registerErrorsRoute,
    registerExchangerStatsRoute,
    registerStatsRoute,
    registerStatsMemoryRoute,
    registerCitySelectorRoute,
    registerCitySelectorByDirRoute,
    registerCitiesRoute,
    registerNonEmptyCitiesRoute,
    registerCityByNameRoute,
    registerDirsRoute,
    registerPossiblePairsRoute,
    registerSimilarDirsRoute,
    registerTopRoute,
    registerCryptoRoute,
  ];

  registerFns.forEach((registerFn) => registerFn(server));
};

export default registerGeneralRoutes;

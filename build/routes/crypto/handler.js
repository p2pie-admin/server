"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cryptoHandler = void 0;
const helper_1 = require("../../helper");
const cryptoToCurrency_1 = require("../../manyRates/cryptoToCurrency");
const cryptoHandler = async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const params = request.params;
    const code = params.code.toUpperCase();
    const currency = params.currency?.toUpperCase();
    const side = params.side;
    const rates = await (0, helper_1.toCache)({
        key: `crypto_${code}_${currency}_${side}`,
        ttl: 30 * 1000,
        getData: async () => {
            const res = await (0, cryptoToCurrency_1.getCryptoToCurrencyRates)({ code, currency, side });
            return res;
        },
    });
    reply.send(JSON.stringify(rates));
};
exports.cryptoHandler = cryptoHandler;

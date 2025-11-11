import { FastifyReply, FastifyRequest } from "fastify";

import { toCache } from "../../helper";
import { getCryptoToCurrencyRates } from "../../manyRates/cryptoToCurrency";

type CryptoToCurrencyRequest = FastifyRequest<{
  Params: { code: string; currency: string; side: "give" | "get" };
}>;

export const cryptoHandler = async (
  request: CryptoToCurrencyRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");

  const params = request.params;
  const code = params.code.toUpperCase();
  const currency = params.currency?.toUpperCase();
  const side = params.side;

  const rates = await toCache({
    key: `crypto_${code}_${currency}_${side}`,
    ttl: 30 * 1000,
    getData: async () => {
      const res = await getCryptoToCurrencyRates({ code, currency, side });
      return res;
    },
  });

  reply.send(JSON.stringify(rates));
};

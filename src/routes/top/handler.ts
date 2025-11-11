import { FastifyReply, FastifyRequest } from "fastify";

import { toCache } from "../../helper";
import { getPopularRates } from "../../manyRates";

export const topHandler = async (_: FastifyRequest, reply: FastifyReply) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const bestRates = await toCache({
    key: "top",
    ttl: 60 * 1000,
    getData: async () => await getPopularRates(),
  });

  reply.send(JSON.stringify(bestRates));
};

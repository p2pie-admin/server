import { FastifyReply, FastifyRequest } from "fastify";

import { toCache } from "../../helper";
import { getPopularRates } from "../../manyRates";

type TopRequest = FastifyRequest<{
  Querystring: { city?: string };
}>;

export const topHandler = async (request: TopRequest, reply: FastifyReply) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const city =
    typeof request.query?.city === "string" && request.query.city.trim()
      ? request.query.city.trim()
      : undefined;
  const bestRates = await toCache({
    key: city ? `top:${city.toLowerCase()}` : "top",
    ttl: 60 * 1000,
    getData: async () => await getPopularRates(city),
  });

  reply.send(JSON.stringify(bestRates));
};

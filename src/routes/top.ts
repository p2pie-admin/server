import { FastifyInstance } from "fastify";

import { toCache } from "../helper";
import { getPopularRates } from "../manyRates";

const registerTopRoute = (server: FastifyInstance) => {
  server.get("/top", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const bestRates = await toCache({
      key: "top",
      ttl: 60 * 1000,
      getData: async () => await getPopularRates(),
    });

    reply.send(JSON.stringify(bestRates));
  });
};

export default registerTopRoute;

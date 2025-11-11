import { FastifyInstance } from "fastify";

import { getObject } from "../redis";

const registerExchangerStatsRoute = (server: FastifyInstance) => {
  server.get("/exchanger_stats", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const stats = await getObject("exchanger_stats");
    reply.send(JSON.stringify(stats));
  });
};

export default registerExchangerStatsRoute;

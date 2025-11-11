import { FastifyInstance } from "fastify";

import { getObject } from "../redis";

const registerStatsRoute = (server: FastifyInstance) => {
  server.get("/stats", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const workerStats = await getObject("stats");
    reply.send(JSON.stringify(workerStats));
  });
};

export default registerStatsRoute;

import { FastifyInstance } from "fastify";

import { getData } from "../redis";

const registerStatsMemoryRoute = (server: FastifyInstance) => {
  server.get("/stats/memory_usage", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const memoryUsage = await getData("stats:memory_usage");
    reply.send(JSON.stringify(memoryUsage));
  });
};

export default registerStatsMemoryRoute;

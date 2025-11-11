import { FastifyInstance } from "fastify";

import { statsMemoryHandler } from "./handler";

const registerStatsMemoryRoute = (server: FastifyInstance) => {
  server.get("/stats/memory_usage", statsMemoryHandler);
};

export default registerStatsMemoryRoute;

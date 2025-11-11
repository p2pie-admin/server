import { FastifyInstance } from "fastify";

import { statsHandler } from "./handler";

const registerStatsRoute = (server: FastifyInstance) => {
  server.get("/stats", statsHandler);
};

export default registerStatsRoute;

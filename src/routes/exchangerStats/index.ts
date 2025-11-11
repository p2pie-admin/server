import { FastifyInstance } from "fastify";

import { exchangerStatsHandler } from "./handler";

const registerExchangerStatsRoute = (server: FastifyInstance) => {
  server.get("/exchanger_stats", exchangerStatsHandler);
};

export default registerExchangerStatsRoute;

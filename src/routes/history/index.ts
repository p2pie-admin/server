import { FastifyInstance } from "fastify";

import { dirHistoryHandler, exchangerHistoryHandler } from "./handler";

const registerHistoryRoute = (server: FastifyInstance) => {
  server.get("/history/dir=:code", dirHistoryHandler);
  server.get("/history/exchanger/:id", exchangerHistoryHandler);
};

export default registerHistoryRoute;

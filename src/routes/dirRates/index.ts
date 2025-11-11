import { FastifyInstance } from "fastify";

import { dirRatesHandler } from "./handler";

const registerDirRatesRoute = (server: FastifyInstance) => {
  server.get("/dir=:code/:type/:city?", dirRatesHandler);
};

export default registerDirRatesRoute;

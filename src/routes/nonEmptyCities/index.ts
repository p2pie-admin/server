import { FastifyInstance } from "fastify";

import { nonEmptyCitiesHandler } from "./handler";

const registerNonEmptyCitiesRoute = (server: FastifyInstance) => {
  server.get("/non_empty_cities", nonEmptyCitiesHandler);
};

export default registerNonEmptyCitiesRoute;

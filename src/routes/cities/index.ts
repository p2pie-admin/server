import { FastifyInstance } from "fastify";

import { citiesHandler } from "./handler";

const registerCitiesRoute = (server: FastifyInstance) => {
  server.get("/cities", citiesHandler);
};

export default registerCitiesRoute;

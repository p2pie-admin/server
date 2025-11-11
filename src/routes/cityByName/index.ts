import { FastifyInstance } from "fastify";

import { cityByNameHandler } from "./handler";

const registerCityByNameRoute = (server: FastifyInstance) => {
  server.get("/city=:name", cityByNameHandler);
};

export default registerCityByNameRoute;

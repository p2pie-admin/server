import { FastifyInstance } from "fastify";

import { citySelectorHandler } from "./handler";

const registerCitySelectorRoute = (server: FastifyInstance) => {
  server.get("/city_selector", citySelectorHandler);
};

export default registerCitySelectorRoute;

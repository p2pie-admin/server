import { FastifyInstance } from "fastify";

import { citySelectorByDirHandler } from "./handler";

const registerCitySelectorByDirRoute = (server: FastifyInstance) => {
  server.get("/city_selector=:dir", citySelectorByDirHandler);
};

export default registerCitySelectorByDirRoute;

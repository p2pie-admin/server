import { FastifyInstance } from "fastify";

import { homeHandler } from "./handler";

const registerHomeRoute = (server: FastifyInstance) => {
  server.get("/", homeHandler);
};

export default registerHomeRoute;

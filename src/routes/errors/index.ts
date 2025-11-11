import { FastifyInstance } from "fastify";

import { errorsHandler } from "./handler";

const registerErrorsRoute = (server: FastifyInstance) => {
  server.get("/errors", errorsHandler);
};

export default registerErrorsRoute;

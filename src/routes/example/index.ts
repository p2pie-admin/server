import { FastifyInstance } from "fastify";

import { exampleHandler } from "./handler";

const registerExampleRoute = (server: FastifyInstance) => {
  server.get("/example", exampleHandler);
};

export default registerExampleRoute;

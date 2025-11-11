import { FastifyInstance } from "fastify";

import { topHandler } from "./handler";

const registerTopRoute = (server: FastifyInstance) => {
  server.get("/top", topHandler);
};

export default registerTopRoute;

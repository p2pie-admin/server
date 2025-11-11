import { FastifyInstance } from "fastify";

import { exchangersHandler } from "./handler";

const registerExchangersRoute = (server: FastifyInstance) => {
  server.get("/exchangers", exchangersHandler);
};

export default registerExchangersRoute;

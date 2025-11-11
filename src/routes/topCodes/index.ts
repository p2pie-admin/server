import { FastifyInstance } from "fastify";

import { topCodesHandler } from "./handler";

const registerTopCodesRoute = (server: FastifyInstance) => {
  server.get("/top_codes", topCodesHandler);
};

export default registerTopCodesRoute;

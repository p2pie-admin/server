import { FastifyInstance } from "fastify";

import { alternativePmCodesHandler } from "./handler";

const registerAlternativePmCodesRoute = (server: FastifyInstance) => {
  server.get("/alternative_pm_codes", alternativePmCodesHandler);
};

export default registerAlternativePmCodesRoute;

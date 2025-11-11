import { FastifyInstance } from "fastify";

import { allPmCodesHandler } from "./handler";

const registerAllPmCodesRoute = (server: FastifyInstance) => {
  server.get("/all_pm_codes_that_exist", allPmCodesHandler);
};

export default registerAllPmCodesRoute;

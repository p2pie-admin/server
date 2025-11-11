import { FastifyInstance } from "fastify";

import { possiblePairsHandler } from "./handler";

const registerPossiblePairsRoute = (server: FastifyInstance) => {
  server.get("/possible_pairs/:side/:code", possiblePairsHandler);
};

export default registerPossiblePairsRoute;

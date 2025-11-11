import { FastifyInstance } from "fastify";

import { similarDirsHandler } from "./handler";

const registerSimilarDirsRoute = (server: FastifyInstance) => {
  server.get("/similar/dirs=:dirsString", similarDirsHandler);
};

export default registerSimilarDirsRoute;

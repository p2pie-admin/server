import { FastifyInstance } from "fastify";

import { dirsHandler } from "./handler";

const registerDirsRoute = (server: FastifyInstance) => {
  server.get("/dirs", dirsHandler);
};

export default registerDirsRoute;

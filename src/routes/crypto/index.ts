import { FastifyInstance } from "fastify";

import { cryptoHandler } from "./handler";

const registerCryptoRoute = (server: FastifyInstance) => {
  server.get("/crypto=:code/:currency/:side", cryptoHandler);
};

export default registerCryptoRoute;

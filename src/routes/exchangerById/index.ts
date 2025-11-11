import { FastifyInstance } from "fastify";

import { exchangerByIdHandler } from "./handler";

const registerExchangerByIdRoute = (server: FastifyInstance) => {
  server.get("/exchanger=:idOrName", exchangerByIdHandler);
};

export default registerExchangerByIdRoute;

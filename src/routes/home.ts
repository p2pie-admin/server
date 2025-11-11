import { FastifyInstance } from "fastify";

const registerHomeRoute = (server: FastifyInstance) => {
  server.get("/", (_, reply) => {
    reply.sendFile("index.html");
  });
};

export default registerHomeRoute;

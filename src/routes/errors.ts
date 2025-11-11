import { FastifyInstance } from "fastify";

import { getData } from "../redis";

const registerErrorsRoute = (server: FastifyInstance) => {
  server.get("/errors", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.send(JSON.stringify(await getData("errors")));
  });
};

export default registerErrorsRoute;

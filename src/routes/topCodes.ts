import { FastifyInstance } from "fastify";

import { getData } from "../redis";

const registerTopCodesRoute = (server: FastifyInstance) => {
  server.get("/top_codes", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const topCodes = await getData("top_codes");
    return reply.send(topCodes);
  });
};

export default registerTopCodesRoute;

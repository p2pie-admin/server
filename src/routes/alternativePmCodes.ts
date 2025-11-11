import { FastifyInstance } from "fastify";

import { getData } from "../redis";

const registerAlternativePmCodesRoute = (server: FastifyInstance) => {
  server.get("/alternative_pm_codes", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const alternative_pm_codes = await getData("alternative_pm_codes");
    return reply.send(JSON.stringify(alternative_pm_codes));
  });
};

export default registerAlternativePmCodesRoute;

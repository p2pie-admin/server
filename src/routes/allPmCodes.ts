import { FastifyInstance } from "fastify";

import { getData } from "../redis";

const registerAllPmCodesRoute = (server: FastifyInstance) => {
  server.get("/all_pm_codes_that_exist", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const all_pm_codes_that_exist = await getData("all_pm_codes_that_exist");
    return reply.send(all_pm_codes_that_exist);
  });
};

export default registerAllPmCodesRoute;

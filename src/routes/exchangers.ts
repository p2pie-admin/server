import { FastifyInstance } from "fastify";

import { getObject } from "../redis";

const registerExchangersRoute = (server: FastifyInstance) => {
  server.get("/exchangers", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");

    const exchangers = await getObject("exchangers");

    reply.send(
      JSON.stringify(
        exchangers && Object.keys(exchangers).length
          ? exchangers
          : "no active exchangers!"
      )
    );
  });
};

export default registerExchangersRoute;

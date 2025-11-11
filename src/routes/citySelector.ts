import { FastifyInstance } from "fastify";

import { getCitySelector } from "./utils";

const registerCitySelectorRoute = (server: FastifyInstance) => {
  server.get("/city_selector", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");

    const citySelector = await getCitySelector();

    reply.send(JSON.stringify(citySelector));
  });
};

export default registerCitySelectorRoute;

import { FastifyInstance } from "fastify";

import { getCitySelector } from "./utils";

const registerCitySelectorByDirRoute = (server: FastifyInstance) => {
  server.get("/city_selector=:dir", async function (request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const { dir } = request.params as { dir: string };
    const citySelector = await getCitySelector(dir);

    reply.send(JSON.stringify(citySelector));
  });
};

export default registerCitySelectorByDirRoute;

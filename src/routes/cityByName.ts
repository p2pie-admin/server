import { FastifyInstance } from "fastify";

import { getData } from "../redis";
import { ICity } from "../types";

const registerCityByNameRoute = (server: FastifyInstance) => {
  server.get("/city=:name", async function (request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const { name } = request.params as { name: string };
    const cities = (await getData("parser_setting"))?.cities as
      | ICity[]
      | undefined;
    if (!cities) {
      reply.send(null);
      return;
    }

    reply.send(
      JSON.stringify(
        cities?.find((c) => c.en_name.toLowerCase() == name.toLowerCase())
      )
    );
  });
};

export default registerCityByNameRoute;

import { FastifyInstance } from "fastify";

import { getData } from "../redis";
import { ICity } from "../types";

const registerCitiesRoute = (server: FastifyInstance) => {
  server.get("/cities", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");

    const cities = (await getData("parser_setting"))?.cities as
      | ICity[]
      | undefined;

    reply.send(JSON.stringify(cities));
  });
};

export default registerCitiesRoute;

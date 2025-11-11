import { FastifyReply, FastifyRequest } from "fastify";

import { getData } from "../../redis";
import { ICity } from "../../types";

export const citiesHandler = async (_: FastifyRequest, reply: FastifyReply) => {
  reply.header("Access-Control-Allow-Origin", "*");

  const cities = (await getData("parser_setting"))?.cities as
    | ICity[]
    | undefined;

  reply.send(JSON.stringify(cities));
};

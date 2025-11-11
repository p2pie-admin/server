import { FastifyReply, FastifyRequest } from "fastify";

import { getCitySelector } from "./utils";

export const citySelectorHandler = async (
  _: FastifyRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");

  const citySelector = await getCitySelector();

  reply.send(JSON.stringify(citySelector));
};

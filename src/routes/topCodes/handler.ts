import { FastifyReply, FastifyRequest } from "fastify";

import { getData } from "../../redis";

export const topCodesHandler = async (
  _: FastifyRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const topCodes = await getData("top_codes");
  return reply.send(topCodes);
};

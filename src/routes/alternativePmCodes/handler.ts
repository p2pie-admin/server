import { FastifyReply, FastifyRequest } from "fastify";

import { getData } from "../../redis";

export const alternativePmCodesHandler = async (
  _: FastifyRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const alternative_pm_codes = await getData("alternative_pm_codes");
  return reply.send(JSON.stringify(alternative_pm_codes));
};

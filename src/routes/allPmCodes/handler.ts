import { FastifyReply, FastifyRequest } from "fastify";

import { getData } from "../../redis";

export const allPmCodesHandler = async (
  _: FastifyRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const all_pm_codes_that_exist = await getData("all_pm_codes_that_exist");
  return reply.send(all_pm_codes_that_exist);
};

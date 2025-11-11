import { FastifyReply, FastifyRequest } from "fastify";

import { getObject } from "../../redis";

export const exchangerStatsHandler = async (
  _: FastifyRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const stats = await getObject("exchanger_stats");
  reply.send(JSON.stringify(stats));
};

import { FastifyReply, FastifyRequest } from "fastify";

import { getData } from "../../redis";

export const statsMemoryHandler = async (
  _: FastifyRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const memoryUsage = await getData("stats:memory_usage");
  reply.send(JSON.stringify(memoryUsage));
};

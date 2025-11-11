import { FastifyReply, FastifyRequest } from "fastify";

import { getObject } from "../../redis";

export const statsHandler = async (_: FastifyRequest, reply: FastifyReply) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const workerStats = await getObject("stats");
  reply.send(JSON.stringify(workerStats));
};

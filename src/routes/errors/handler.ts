import { FastifyReply, FastifyRequest } from "fastify";

import { getData } from "../../redis";

export const errorsHandler = async (_: FastifyRequest, reply: FastifyReply) => {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.send(JSON.stringify(await getData("errors")));
};

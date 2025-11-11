import { FastifyReply, FastifyRequest } from "fastify";

export const homeHandler = (_: FastifyRequest, reply: FastifyReply) => {
  reply.sendFile("index.html");
};

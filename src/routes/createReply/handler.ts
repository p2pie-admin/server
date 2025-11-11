import { FastifyReply, FastifyRequest } from "fastify";

type JsonBodyRequest = FastifyRequest<{
  Body: Record<string, unknown>;
}>;

export const createReplyHandler = async (
  request: JsonBodyRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");
  request.server.log.info(
    { reviewReply: request.body },
    "Received /createReply payload"
  );
  reply.send({ status: "ok" });
};

export const createReplyOptionsHandler = async (
  _: FastifyRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type");
  reply.status(204).send();
};

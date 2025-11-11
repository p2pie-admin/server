import { FastifyInstance, FastifyRequest } from "fastify";

type JsonBodyRequest = FastifyRequest<{
  Body: Record<string, unknown>;
}>;

const registerCreateReplyRoute = (server: FastifyInstance) => {
  server.post("/createReply", async function (request: JsonBodyRequest, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    server.log.info(
      { reviewReply: request.body },
      "Received /createReply payload"
    );
    reply.send({ status: "ok" });
  });

  server.options("/createReply", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
    reply.status(204).send();
  });
};

export default registerCreateReplyRoute;

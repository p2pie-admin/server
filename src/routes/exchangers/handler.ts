import { FastifyReply, FastifyRequest } from "fastify";

import { getObject } from "../../redis";

export const exchangersHandler = async (
  _: FastifyRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");

  const exchangers = await getObject("exchangers");

  reply.send(
    JSON.stringify(
      exchangers && Object.keys(exchangers).length
        ? exchangers
        : "no active exchangers!"
    )
  );
};

import { FastifyReply, FastifyRequest } from "fastify";

import { getFirstObjectEntry, getKeys, getObject } from "../../redis";

export const exampleHandler = async (_: FastifyRequest, reply: FastifyReply) => {
  reply.header("Access-Control-Allow-Origin", "*");

  const keys = await getKeys();

  const exampleData = await Promise.all(
    keys.map(async (key) => {
      const value = await getObject(key);

      let sample;
      if (Array.isArray(value)) {
        sample = value[0];
      } else if (value && typeof value === "object") {
        sample = getFirstObjectEntry(value);
      } else {
        sample = value;
      }

      return { key, sample };
    })
  );

  reply.send(exampleData);
};

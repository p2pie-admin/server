import { FastifyInstance } from "fastify";

import { getFirstObjectEntry, getKeys, getObject } from "../redis";

const registerExampleRoute = (server: FastifyInstance) => {
  server.get("/example", async function (_, reply) {
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
  });
};

export default registerExampleRoute;

import { FastifyInstance } from "fastify";

import { getObject } from "../redis";
import { IExchanger } from "../types/exchanger";

const registerExchangerByIdRoute = (server: FastifyInstance) => {
  server.get("/exchanger=:idOrName", async function (request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const { idOrName } = request.params as { idOrName: string };
    const exchangers = (await getObject("exchangers")) as {
      [key: string]: IExchanger;
    };
    reply.send(
      JSON.stringify(
        exchangers && Object.keys(exchangers).length
          ? exchangers[idOrName] ||
              Object.values(exchangers).find(
                (e) =>
                  e.name.toLocaleLowerCase() === idOrName.toLocaleLowerCase()
              ) ||
              {}
          : "no exchangers exist"
      )
    );
  });
};

export default registerExchangerByIdRoute;

import { FastifyReply, FastifyRequest } from "fastify";

import { getObject } from "../../redis";
import { IExchanger } from "../../types/exchanger";

type ExchangerByIdRequest = FastifyRequest<{
  Params: { idOrName: string };
}>;

export const exchangerByIdHandler = async (
  request: ExchangerByIdRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const { idOrName } = request.params;
  const exchangers = (await getObject("exchangers")) as {
    [key: string]: IExchanger;
  };
  reply.send(
    JSON.stringify(
      exchangers && Object.keys(exchangers).length
        ? exchangers[idOrName] ||
            Object.values(exchangers).find(
              (e) => e.name.toLocaleLowerCase() === idOrName.toLocaleLowerCase()
            ) ||
            {}
        : "no exchangers exist"
    )
  );
};

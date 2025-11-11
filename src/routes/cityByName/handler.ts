import { FastifyReply, FastifyRequest } from "fastify";

import { getData } from "../../redis";
import { ICity } from "../../types";

type CityByNameRequest = FastifyRequest<{
  Params: { name: string };
}>;

export const cityByNameHandler = async (
  request: CityByNameRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const { name } = request.params;
  const cities = (await getData("parser_setting"))?.cities as
    | ICity[]
    | undefined;
  if (!cities) {
    reply.send(null);
    return;
  }

  reply.send(
    JSON.stringify(
      cities?.find((c) => c.en_name.toLowerCase() == name.toLowerCase())
    )
  );
};

import { FastifyReply, FastifyRequest } from "fastify";

import { getCitySelector } from "../citySelector/utils";

type CitySelectorByDirRequest = FastifyRequest<{
  Params: { dir: string };
}>;

export const citySelectorByDirHandler = async (
  request: CitySelectorByDirRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const { dir } = request.params;
  const citySelector = await getCitySelector(dir);

  reply.send(JSON.stringify(citySelector));
};

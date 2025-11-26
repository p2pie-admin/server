import { FastifyReply, FastifyRequest } from "fastify";

import { toCache } from "../../helper";
import getPossiblePairs from "../../possiblePairs";

type PossiblePairsRequest = FastifyRequest<{
  Params: { side: "give" | "get"; code: string };
}>;

export const possiblePairsHandler = async (
  request: PossiblePairsRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const param = request.params as { side: "give" | "get"; code: string };
  const code = param.code.toUpperCase();
  const side = param.side;

  const possiblePairs = await toCache({
    key: `possible_pairs_${side}_${code}`,
    ttl: 60 * 1000,
    getData: async () => getPossiblePairs({ side, code }),
  });

  return reply.send(JSON.stringify(possiblePairs));
};

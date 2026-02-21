import { FastifyReply, FastifyRequest } from "fastify";

import { getSimilarRates } from "../../manyRates";

type SimilarDirsRequest = FastifyRequest<{
  Params: { dirsString: string };
  Querystring: { city?: string };
}>;

export const similarDirsHandler = async (
  request: SimilarDirsRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const { dirsString } = request.params;
  const city = request.query?.city?.trim().toLowerCase();
  const dirs = dirsString.split(",");
  if (!dirs || !dirs.length) {
    reply.send(
      "wrong dirs, try /similar/dirs=BTC_SBERRUB,BTC_TCSBRUB or /similar/dirs=BTC_CASHRUB,BTC_TCSBRUB?city=moscow"
    );
    return;
  }

  reply.send(JSON.stringify(await getSimilarRates(dirs, city)));
};

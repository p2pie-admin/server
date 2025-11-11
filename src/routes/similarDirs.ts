import { FastifyInstance } from "fastify";

import { getSimilarRates } from "../manyRates";

const registerSimilarDirsRoute = (server: FastifyInstance) => {
  server.get("/similar/dirs=:dirsString", async function (request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const { dirsString } = request.params as { dirsString: string };
    const dirs = dirsString.split(",");
    if (!dirs || !dirs.length) {
      reply.send("wrong dirs, try /similar/dirs=BTC_SBERRUB,BTC_TCSBRUB");
      return;
    }

    reply.send(JSON.stringify(await getSimilarRates(dirs)));
  });
};

export default registerSimilarDirsRoute;

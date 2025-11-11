import { FastifyInstance } from "fastify";

import { getObject } from "../redis";
import { IAllDirtyRates } from "../types/rates";
import { toCache } from "../helper";

const registerDirsRoute = (server: FastifyInstance) => {
  server.get("/dirs", async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const dirs = await toCache({
      key: "dirs",
      getData: async () => {
        const allDirtyRates = (await getObject(
          "allDirtyRates"
        )) as IAllDirtyRates;
        const totalRatesByDir = Object.entries(allDirtyRates).reduce(
          (res: { [key: string]: number }, [code, dirRate]) => {
            res = { ...res, [code]: Object.keys(dirRate).length };
            return res;
          },
          {}
        );
        const sortedArray = Object.entries(totalRatesByDir)
          .filter(
            ([, value]) => value > Number(process.env.DIR_RATES_MIN || "3")
          )
          .sort(([, valueA], [, valueB]) => valueA - valueB)
          .reverse();
        return Object.fromEntries(sortedArray);
      },
    });
    reply.send(JSON.stringify(dirs));
  });
};

export default registerDirsRoute;

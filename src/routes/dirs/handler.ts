import { FastifyReply, FastifyRequest } from "fastify";

import { toCache } from "../../helper";
import { getObject } from "../../redis";
import { IAllDirtyRates } from "../../types/rates";

export const dirsHandler = async (_: FastifyRequest, reply: FastifyReply) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const dirs = await toCache({
    key: "dirs",
    getData: async () => {
      const allDirtyRates = (await getObject("allDirtyRates")) as IAllDirtyRates;
      const totalRatesByDir = Object.entries(allDirtyRates).reduce(
        (res: { [key: string]: number }, [code, dirRate]) => {
          res = { ...res, [code]: Object.keys(dirRate).length };
          return res;
        },
        {}
      );
      const sortedArray = Object.entries(totalRatesByDir)
        .filter(([, value]) => value > Number(process.env.DIR_RATES_MIN || "3"))
        .sort(([, valueA], [, valueB]) => valueA - valueB)
        .reverse();
      return Object.fromEntries(sortedArray);
    },
  });
  reply.send(JSON.stringify(dirs));
};

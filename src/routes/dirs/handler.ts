import { FastifyReply, FastifyRequest } from "fastify";

import { extractOrderedRateIds, getDirRatesMin, toCache } from "../../helper";
import { getObject } from "../../redis";
import { IAllRatesID } from "../../types/rates";

export const dirsHandler = async (_: FastifyRequest, reply: FastifyReply) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const dirs = await toCache({
    key: "dirs",
    ttl: 60 * 1000,
    getData: async () => {
      const allRatesID = (await getObject("allRatesID")) as IAllRatesID | null;
      if (!allRatesID) return {};
      const dirRatesMin = getDirRatesMin();
      const totalRatesByDir = Object.entries(allRatesID).reduce(
        (res: { [key: string]: number }, [code, entries]) => {
          const total = extractOrderedRateIds(entries).length;
          if (total >= dirRatesMin) {
            res = { ...res, [code]: total };
          }
          return res;
        },
        {}
      );
      const sortedArray = Object.entries(totalRatesByDir)
        .sort(([, valueA], [, valueB]) => valueA - valueB)
        .reverse();
      return Object.fromEntries(sortedArray);
    },
  });
  reply.send(JSON.stringify(dirs));
};

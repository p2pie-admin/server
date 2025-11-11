import { FastifyReply, FastifyRequest } from "fastify";

import { getData, getObject } from "../../redis";
import { ICity } from "../../types";
import { IAllDirtyRates } from "../../types/rates";

export const nonEmptyCitiesHandler = async (
  _: FastifyRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");

  const cities = (await getData("parser_setting"))?.cities as
    | ICity[]
    | undefined;
  if (!cities) {
    reply.send(null);
    return;
  }

  const allDirtyRates = (await getObject("allDirtyRates")) as IAllDirtyRates;
  const nonEmpty = cities.reduce((res, city) => {
    const dirRatesTotal = Object.entries(allDirtyRates).reduce(
      (innerRes, [dir, dirRates]) => {
        const totalByCity = Object.values(dirRates).filter(
          (r) =>
            r.cityRates &&
            Object.keys(r.cityRates).find(
              (cen) => cen.toLowerCase() == city?.en_name.toLowerCase()
            )
        ).length;
        return totalByCity ? { ...innerRes, [dir]: totalByCity } : innerRes;
      },
      {}
    );
    return Object.keys(dirRatesTotal).length
      ? { ...res, [city.en_name.toLowerCase()]: dirRatesTotal }
      : res;
  }, {});

  reply.send(JSON.stringify(nonEmpty));
};

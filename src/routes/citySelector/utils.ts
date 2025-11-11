import { getData, getObject } from "../../redis";
import { convertCitiesToSelector, toCache } from "../../helper";
import { ICity } from "../../types";
import { IAllDirtyRates } from "../../types/rates";

export const getCitySelector = async (dir?: string) => {
  return toCache({
    key: `city_selector:${dir ?? "all"}`,
    ttl: 2 * 60 * 60 * 1000,
    getData: async () => {
      const cities = (await getData("parser_setting"))?.cities as
        | ICity[]
        | undefined;
      const allDirtyRates = (await getObject("allDirtyRates")) as
        | IAllDirtyRates
        | undefined;

      return convertCitiesToSelector(dir, cities, allDirtyRates);
    },
  });
};

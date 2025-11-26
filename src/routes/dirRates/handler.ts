import { FastifyReply, FastifyRequest } from "fastify";

import { getCleanDirRates, toCache } from "../../helper";
import { IRate } from "../../types/rates";

type DirRequest = FastifyRequest<{
  Params: { code: string; city: string; type: "all" | "part" };
}>;

export const dirRatesHandler = async (
  request: DirRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");

  const params = request.params;
  const code = params.code.toUpperCase();
  const city = params.city?.toLowerCase();
  const type = params.type;

  const rates = await toCache({
    key: `rates_${code}_${city || "no-city"}_${type}`,
    ttl: 30 * 1000,
    getData: async () => {
      const cleanDirRates = await getCleanDirRates(code);
      if (!cleanDirRates) return [];

      const newRates = Object.values(cleanDirRates);

      if (!city) {
        return newRates;
      }

      const cityKey = city.toLowerCase();

      const ratesWithCity = newRates.reduce((res: IRate[], rate) => {
        const cityRateEntry = rate.cityRates?.[cityKey];
        if (!cityRateEntry) return res;

        const cityRateData =
          typeof cityRateEntry === "object" && cityRateEntry !== null
            ? (cityRateEntry as any)
            : undefined;

        const normalizedEntry =
          cityRateData && "rate" in cityRateData && cityRateData.rate
            ? { ...cityRateData }
            : { rate: cityRateEntry };

        const sanitizedRate = {
          ...(rate as unknown as Record<string, unknown>),
          cityRates: {
            [cityKey]: normalizedEntry,
          },
        } as unknown as IRate;

        return [...res, sanitizedRate];
      }, []);

      const getCityRateValue = (rate: IRate) => {
        const entry = (rate.cityRates?.[cityKey] ?? {}) as any;
        const cityRate = entry?.rate ?? entry;
        const rawCourse = (cityRate as any)?.course ?? cityRate;
        const num = Number(rawCourse);
        return Number.isFinite(num) ? num : Number.POSITIVE_INFINITY;
      };

      return ratesWithCity
        .map((rate, idx) => ({ rate, idx }))
        .sort((a, b) => {
          const diff = getCityRateValue(a.rate) - getCityRateValue(b.rate);
          return diff !== 0 ? diff : a.idx - b.idx;
        })
        .map((item) => item.rate);
    },
  });

  reply.send(JSON.stringify(rates));
};

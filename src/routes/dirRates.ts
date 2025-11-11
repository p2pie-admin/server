import { FastifyInstance, FastifyRequest } from "fastify";

import { getCleanDirRates, toCache } from "../helper";
import { IRate } from "../types/rates";

type DirRequest = FastifyRequest<{
  Params: { code: string; city: string; type: "all" | "part" };
}>;

const registerDirRatesRoute = (server: FastifyInstance) => {
  server.get(
    "/dir=:code/:type/:city?",
    async function (request: DirRequest, reply) {
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

          return newRates.reduce((res: IRate[], rate) => {
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
        },
      });

      reply.send(JSON.stringify(rates));
    }
  );
};

export default registerDirRatesRoute;

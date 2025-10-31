import Fastify, { FastifyRequest } from "fastify";
import dotenv from "dotenv";

import { getData, getFirstObjectEntry, getKeys, getObject } from "./redis";
import path from "path";
import fastifyStatic from "@fastify/static";
import { IExchanger } from "./types/exchanger";
import { IAllDirtyRates, IRate } from "./types/rates";
import { ICity, IParserSetting } from "./types";

import { convertCitiesToSelector, getCleanDirRates, toCache } from "./helper";
import { IPopularDirs } from "./types/pms";
import getPossiblePairs from "./possiblePairs";
import { getSimilarRates, getPopularRates } from "./manyRates";
import { getCryptoToCurrencyRates } from "./manyRates/cryptoToCurrency";

dotenv.config();

export const cache = new Map(); // In-memory cache

const server = Fastify({
  logger: true,
});

server.register(fastifyStatic, {
  root: path.join(__dirname, "../public"), // Path to your public directory
  prefix: "/", // Optional: serve under a specific prefix
});

server.get("/", (_, reply) => {
  reply.sendFile("index.html"); // Automatically serve index.html
});

server.get("/example", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");

  const keys = await getKeys();

  const exampleData = await Promise.all(
    keys.map(async (key) => {
      const value = await getObject(key);

      let sample;
      if (Array.isArray(value)) {
        sample = value[0]; // first item from array
      } else if (value && typeof value === "object") {
        sample = getFirstObjectEntry(value);
      } else {
        sample = value; // fallback for string, number, etc.
      }

      return { key, sample };
    })
  );

  reply.send(exampleData);
});
type dirReq = FastifyRequest<{
  Params: { code: string; city: string; type: "all" | "part" };
}>;

server.get("/dir=:code/:type/:city?", async function (request: dirReq, reply) {
  reply.header("Access-Control-Allow-Origin", "*");

  const params = request.params;
  const code = params.code.toUpperCase();
  const city = params.city?.toLowerCase();
  const type = params.type;

  const rates = await toCache({
    key: `rates_${code}_${city || "no-city"}_${type}`,
    ttl: 30 * 1000,
    getData: async () => {
      const pause = await getData("parser_setting").then(
        (data) => data?.pause_between_loops || 10
      );
      const ratesTTL =
        process.env.NODE_ENV === "production" ? 1000 * (300 + pause) : 10 ** 10;
      const cleanDirRates = await getCleanDirRates(code, type);
      if (!cleanDirRates) return [];
      const now = Date.now();
      const newRates = Object.values(cleanDirRates).filter(
        (r) => r.last_time_updated && now - r.last_time_updated < ratesTTL
      );

      if (!city) return newRates;

      return newRates.reduce((res: IRate[], r) => {
        const cityRate = r.cityRates?.[city.toLowerCase()];
        if (!cityRate) return res;
        return [...res, cityRate];
      }, []);
    },
  });

  reply.send(JSON.stringify(rates));
});

server.get("/top_codes", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const topCodes = await getData("top_codes");
  return reply.send(topCodes);
});

server.get("/all_pm_codes_that_exist", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const all_pm_codes_that_exist = await getData("all_pm_codes_that_exist");
  return reply.send(all_pm_codes_that_exist);
});

server.get("/alternative_pm_codes", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const alternative_pm_codes = await getData("alternative_pm_codes");
  return reply.send(JSON.stringify(alternative_pm_codes));
});

server.get("/parser_setting", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const parserSetting = (await getData("parser_setting")) as
    | IParserSetting
    | null;
  return reply.send(JSON.stringify(parserSetting));
});

server.get("/parser_jwt", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const token = await getData("parser_jwt");
  return reply.send(JSON.stringify(token));
});

server.get("/exchangers", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");

  const exchangers = await getObject("exchangers");

  reply.send(
    JSON.stringify(
      exchangers && Object.keys(exchangers).length
        ? exchangers
        : "no active exchangers!"
    )
  );
});

server.get("/exchanger=:idOrName", async function (request, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const { idOrName } = request.params as { idOrName: string };
  const exchangers = (await getObject("exchangers")) as {
    [key: string]: IExchanger;
  };
  reply.send(
    JSON.stringify(
      exchangers && Object.keys(exchangers).length
        ? exchangers[idOrName] ||
            Object.values(exchangers).find(
              (e) => e.name.toLocaleLowerCase() === idOrName.toLocaleLowerCase()
            ) ||
            {}
        : "no exchangers exist"
    )
  );
});

server.get("/errors", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.send(JSON.stringify(await getData("errors")));
});

server.get("/exchanger_stats", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const stats = await getObject("exchanger_stats");
  reply.send(JSON.stringify(stats));
});

server.get("/stats", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const workerStats = await getObject("stats");
  reply.send(JSON.stringify(workerStats));
});

server.get("/stats/memory_usage", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const memoryUsage = await getData("stats:memory_usage");
  reply.send(JSON.stringify(memoryUsage));
});

server.get("/city_selector=:dir", async function (request, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const { dir } = request.params as { dir: string };
  const citySelector = await toCache({
    key: `city_selector`,
    ttl: 2 * 60 * 60 * 1000,
    getData: async () => {
      const cities = (await getData("parser_setting"))?.cities as
        | ICity[]
        | undefined;
      const allDirtyRates = (await getObject(
        "allDirtyRates"
      )) as IAllDirtyRates;
      return convertCitiesToSelector(dir, cities, allDirtyRates);
    },
  });

  reply.send(JSON.stringify(citySelector));
});

server.get("/cities", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");

  const cities = (await getData("parser_setting"))?.cities as
    | ICity[]
    | undefined;

  reply.send(JSON.stringify(cities));
});

server.get("/non_empty_cities", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");

  const cities = (await getData("parser_setting"))?.cities as
    | ICity[]
    | undefined;
  if (!cities) reply.send(null);

  const allDirtyRates = (await getObject("allDirtyRates")) as IAllDirtyRates;
  const nonEmpty = cities?.reduce((res, city) => {
    const dirRatesTotal = Object.entries(allDirtyRates).reduce(
      (res, [dir, dirRates]) => {
        const totalByCity = Object.values(dirRates).filter(
          (r) =>
            r.cityRates &&
            Object.keys(r.cityRates).find(
              (cen) => cen.toLowerCase() == city?.en_name.toLowerCase()
            )
        ).length;
        return totalByCity ? { ...res, [dir]: totalByCity } : res;
      },
      {}
    );
    return Object.keys(dirRatesTotal).length
      ? { ...res, [city.en_name.toLowerCase()]: dirRatesTotal }
      : res;
  }, {});

  reply.send(JSON.stringify(nonEmpty));
});

server.get("/city=:name", async function (request, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const { name } = request.params as { name: string };
  const cities = (await getData("parser_setting"))?.cities as
    | ICity[]
    | undefined;
  if (!cities) reply.send(null);

  reply.send(
    JSON.stringify(
      cities?.find((c) => c.en_name.toLowerCase() == name.toLowerCase())
    )
  );
});

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
        .filter(([, value]) => value > Number(process.env.DIR_RATES_MIN || "3"))
        .sort(([, valueA], [, valueB]) => valueA - valueB)
        .reverse();
      return Object.fromEntries(sortedArray);
    },
  });
  reply.send(JSON.stringify(dirs));
});

type possiblePairsReq = FastifyRequest<{
  Params: { side: "give" | "get"; code: string };
}>;

server.get(
  "/possible_pairs/:side/:code",
  async function (request: possiblePairsReq, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const param = request.params as { side: "give" | "get"; code: string };
    const code = param.code.toUpperCase();
    const side = param.side;

    //const possiblePairs = await getPossiblePairs({ side });
    const possiblePairs = await toCache({
      key: `possible_pairs_${side}_${code}`,
      ttl: 600 * 1000,
      getData: async () => getPossiblePairs({ side, code }),
    });
    // if (!code) return reply.send(JSON.stringify(possiblePairs));
    return reply.send(JSON.stringify(possiblePairs));
  }
);

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

server.get("/top", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const bestRates = await toCache({
    key: "top",
    ttl: 2 * 60 * 1000,
    getData: async () => await getPopularRates(),
  });

  reply.send(JSON.stringify(bestRates));
});

type ICryptoToCurrencyRequest = FastifyRequest<{
  Params: { code: string; currency: string; side: "give" | "get" };
}>;
server.get(
  "/crypto=:code/:currency/:side",
  async function (request: ICryptoToCurrencyRequest, reply) {
    reply.header("Access-Control-Allow-Origin", "*");

    const params = request.params;
    const code = params.code.toUpperCase();
    const currency = params.currency?.toUpperCase();
    const side = params.side;

    const rates = await toCache({
      key: `crypto_${code}_${currency}_${side}`,
      ttl: 30 * 1000,
      getData: async () => {
        const res = await getCryptoToCurrencyRates({ code, currency, side });
        return res;
      },
    });

    reply.send(JSON.stringify(rates));
  }
);

///

const port = +process.env.RATES_PORT! || 5000;

// Run the server!
const start = async () => {
  try {
    await server.listen({ port, host: "0.0.0.0" });
    //await auth();
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};
start();

import Fastify, { FastifyRequest } from "fastify";
import dotenv from "dotenv";

import { getData, getFirstObjectEntry, getKeys, getObject } from "./redis";
import path from "path";
import fastifyStatic from "@fastify/static";
import { IExchanger } from "./types/exchanger";
import { IAllDirtyRates, IRate } from "./types/rates";
import { ICity } from "./types";
import { getPopularRates, getSimilarRates } from "./getPopularRates";
import { convertCitiesToSelector, getCleanDirRates, toCache } from "./helper";
import { dir } from "console";
import { IPopularDirs } from "./types/pms";
import getPossiblePairs from "./possibleDirs";

dotenv.config();
const ratesTTL = process.env.NODE_ENV === "production" ? 1000 * 300 : 10 ** 10;
const cache = new Map(); // In-memory cache

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

server.get("/dir=:code/:city?", async function (request: dirReq, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const { code, city } = request.params;

  const rates = await toCache({
    cache,
    key: `rates_${code}_${city}`,
    ttl: 30 * 1000,
    getData: async () => {
      const cleanDirRates = await getCleanDirRates(code);
      if (!cleanDirRates) return [];
      const now = Date.now();
      const newRates = Object.values(cleanDirRates).filter(
        (r) => r.last_time_updated && now - r.last_time_updated < 1000000000
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

server.get("/city_selector=:dir", async function (request, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const { dir } = request.params as { dir: string };
  const citySelector = await toCache({
    cache,
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
    cache,
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
        .sort(([, valueA], [, valueB]) => valueA - valueB)
        .reverse();
      return Object.fromEntries(sortedArray);
    },
  });
  reply.send(JSON.stringify(dirs));
});

type dirReq = FastifyRequest<{ Params: { code: string; city: string } }>;
type possiblePairsReq = FastifyRequest<{ Params: { code: string } }>;

server.get(
  "/possible_pairs/code=:code",
  async function (request: possiblePairsReq, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const { code } = request.params as { code: string };
    const possiblePairs = await toCache({
      cache,
      key: `possible_pairs`,
      ttl: 600 * 1000,
      getData: async () => getPossiblePairs(),
    });

    if (!code) return reply.send(JSON.stringify(possiblePairs));
    return reply.send(JSON.stringify(possiblePairs[code] || []));
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
  const bestRates = await getPopularRates();
  reply.send(JSON.stringify(bestRates));
});

server.get("/popular_dirs", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const popularDirs = (await getData("popular_dirs")) as IPopularDirs;
  reply.send(JSON.stringify(popularDirs));
});

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

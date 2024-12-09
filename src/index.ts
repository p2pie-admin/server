import Fastify, { FastifyRequest } from "fastify";
import dotenv from "dotenv";

import { getData, getObject } from "./redis";
import path from "path";
import fastifyStatic from "@fastify/static";
import { IExchanger } from "./types/exchanger";
import { IAllDirsRates, IRate } from "./types/rates";
import { ICity } from "./types";
import { getPopularRates, getSimilarRates } from "./getPopularRates";
import { convertCitiesToSelector, toCache } from "./helper";

dotenv.config();
const cache = new Map(); // In-memory cache

const server = Fastify({
  logger: true,
});

server.register(fastifyStatic, {
  root: path.join(__dirname, "../public"), // Path to your public directory
  prefix: "/", // Optional: serve under a specific prefix
});

server.get("/", (request, reply) => {
  reply.sendFile("index.html"); // Automatically serve index.html
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

server.get("/city_selector", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const citySelector = await toCache({
    cache,
    key: `city_selector`,
    ttl: 2 * 60 * 60 * 1000,
    getData: async () => {
      const cities = (await getData("parser_setting"))?.cities as
        | ICity[]
        | undefined;
      const allDirRates = (await getObject("allDirRates")) as IAllDirsRates;
      return convertCitiesToSelector(cities, allDirRates);
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

server.get("/city=:name", async function (request, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const { name } = request.params as { name: string };
  const cities = (await getData("parser_setting"))?.cities as
    | ICity[]
    | undefined;
  if (!cities || !name) reply.send(null);
  reply.send(
    JSON.stringify(
      cities?.find((c) => c.en_name.toLowerCase() == name?.toLowerCase())
    )
  );
});

server.get("/test_rates", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const allDirTops = (await getObject("allDirTops")) as IAllDirsRates;
  reply.send(
    JSON.stringify(Object.fromEntries(Object.entries(allDirTops).slice(0, 20)))
  );
});

server.get("/dirs", async (_, reply) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const dirs = await toCache({
    cache,
    key: "dirs",
    getData: async () => {
      const allDirRates = (await getObject("allDirRates")) as IAllDirsRates;
      const totalRatesByDir = Object.entries(allDirRates).reduce(
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
  "/possible_pairs",
  async function (request: possiblePairsReq, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.send(JSON.stringify(await getData(`possible_pairs`)));
  }
);

server.get(
  "/possible_pairs/code=:code",
  async function (request: possiblePairsReq, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const { code } = request.params as { code: string };
    if (!code) return null;
    const pp = (await getData(`possible_pairs`)) as { [key: string]: string[] };
    reply.send(JSON.stringify(pp?.[code?.toUpperCase()] || null));
  }
);

server.get("/dir=:code/:city?", async function (request: dirReq, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const { code, city } = request.params;

  const rates = await toCache({
    cache,
    key: `rates_${code}_${city}`,
    ttl: 30 * 1000,
    getData: async () => {
      const rates = (await getData(`allDirTops:${code}`)) as IRate[];
      if (!rates) return [];
      const now = Date.now();
      const newRates = rates.filter(
        (r) =>
          r.last_time_updated && now - r.last_time_updated < 1000 * 60 * 1000
      );

      if (!city) return JSON.stringify(newRates);

      return newRates.reduce((res: IRate[], r) => {
        const cityRate = r.cityRates?.[city.toLowerCase()];
        if (!cityRate) return res;
        return [...res, cityRate];
      }, []);
    },
  });

  reply.send(JSON.stringify(rates));
  //JSON.stringify(
});

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

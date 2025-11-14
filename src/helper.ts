import { getData, getObject } from "./redis";
import { ICity } from "./types";
import { ISelectorCountry } from "./types/localTypes";
import { IAllDirtyRates, IRate, IRatesID, RatesIdEntry } from "./types/rates";
import { cache } from "./index";
import { IExchanger } from "./types/exchanger";

const countryWeights = {
  Russia: 5,
  Turkey: 2,
  Ukraine: 4,
  Belarus: 4,
  Kazakhstan: 3,
  Azerbaijan: 3,
  Armenia: 2,
  Uzbekistan: 2,
} as any;

export function convertCitiesToSelector(
  dir?: string,
  cities?: ICity[],
  allDirtyRates?: IAllDirtyRates
): ISelectorCountry[] {
  const groupedByCountry: Record<string, ISelectorCountry> = {};

  if (!cities || !allDirtyRates) return [];

  const relevantDirKeys = dir ? [dir] : Object.keys(allDirtyRates);
  const cityRateCounts = new Map<string, number>();

  for (const dirKey of relevantDirKeys) {
    const dirRates = allDirtyRates[dirKey];
    if (!dirRates) continue;

    for (const rate of Object.values(dirRates)) {
      const cityRates = rate?.cityRates;
      if (!cityRates || typeof cityRates !== "object") continue;

      for (const cityName of Object.keys(cityRates)) {
        const normalizedName = cityName?.trim().toLowerCase();
        if (!normalizedName) continue;

        cityRateCounts.set(
          normalizedName,
          (cityRateCounts.get(normalizedName) || 0) + 1
        );
      }
    }
  }

  for (const city of cities) {
    const normalizedName = city.en_name.trim().toLowerCase();

    const totalCityRates = cityRateCounts.get(normalizedName) ?? 0;
    if (totalCityRates < 2) continue; // убираем одиночек

    const countryKey = `${city.en_country_name}-${city.ru_country_name}`;

    if (!groupedByCountry[countryKey]) {
      groupedByCountry[countryKey] = {
        en_country_name: city.en_country_name,
        ru_country_name: city.ru_country_name,
        weight: countryWeights[city.en_country_name] || 1,
        cities: [],
      };
    }

    groupedByCountry[countryKey].cities.push({
      en_name: city.en_name,
      ru_name: city.ru_name,
      population: city.population,
      totalCityRates,
    });
  }

  return Object.values(groupedByCountry);
}

// export const setCacheData = ({
//   cache,
//   key,
//   data,
// }: {
//   cache: Map<any, any>;
//   key: string;
//   data: any;
// }) => {
//   const now = Date.now();
//   cache.set(key, { data, timestamp: now });
// };

// функция кэширует чтобы не делать обращение к базе и не делать вычислений многократно

export const toCache = async ({
  key,
  ttl = 60 * 1000,
  getData,
}: {
  key: string;
  ttl?: number;
  getData: Function;
}) => {
  const now = Date.now();
  if (cache.has(key)) {
    const cached = cache.get(key);
    if (now - cached.timestamp < ttl) {
      return cached.data; // Return cached response
    }
  }
  const data = await getData();
  cache.set(key, { data, timestamp: now });
  console.log(`Set cache: ${key} | ${ttl / 1000}s`);
  return data;
};

export const extractOrderedRateIds = (
  ratesID?: IRatesID | null
): { id: string; tags: string[] }[] => {
  if (!Array.isArray(ratesID)) return [];

  const seen = new Set<string>();
  const normalized: { id: string; tags: string[] }[] = [];

  for (const entry of ratesID) {
    if (!entry || typeof entry !== "object") continue;

    const record = entry as RatesIdEntry;
    for (const [rawId, rawTags] of Object.entries(record)) {
      const id = rawId?.trim();
      if (!id || seen.has(id)) continue;

      const tags = Array.isArray(rawTags)
        ? rawTags.filter((tag): tag is string => typeof tag === "string")
        : [];

      normalized.push({ id, tags });
      seen.add(id);
    }
  }

  return normalized;
};

export const getCleanDirRates = async (dir: string): Promise<IRate[]> => {
  const dirtyDirRates = (await getObject(`allDirtyRates:${dir}`)) as Record<
    string,
    IRate
  > | null;
  const exchangers = (await getObject("exchangers")) as
    | Record<string, IExchanger>
    | null;
  const exchangersList = exchangers ? Object.values(exchangers) : [];
  const ratesID = (await getData(`allRatesID:${dir}`)) as IRatesID | null;

  if (!dirtyDirRates) {
    return [];
  }

  const normalizedIds = extractOrderedRateIds(ratesID);
  const parameterCodesMap = new Map<string, string[]>();

  for (const { id, tags } of normalizedIds) {
    parameterCodesMap.set(id, [...tags]);
  }

  const resolveDisplayName = (rate: IRate): string | null | undefined => {
    if (rate.display_name !== undefined) {
      return rate.display_name;
    }

    if (!exchangers) return undefined;

    const rawId = (rate as IRate & { exchangerId?: string | number })
      .exchangerId;
    if (rawId === undefined || rawId === null) return undefined;

    const idKey = String(rawId);
    const exchanger =
      exchangers[idKey] ||
      exchangers[String(Number(idKey))] ||
      exchangersList.find((item) => item.id === idKey);

    return exchanger?.display_name;
  };

  const enhanceRate = (id: string, rate: IRate): IRate => {
    const codes = parameterCodesMap.get(id);
    const displayName = resolveDisplayName(rate);

    if (!codes && displayName === undefined) {
      return rate;
    }

    return {
      ...rate,
      ...(codes ? { parameterCodes: [...codes] } : {}),
      ...(displayName !== undefined ? { display_name: displayName } : {}),
    };
  };

  if (!normalizedIds.length) {
    return Object.entries(dirtyDirRates).map(([id, rate]) =>
      enhanceRate(id, rate)
    );
  }

  const collected: IRate[] = [];
  const used = new Set<string>();

  for (const { id } of normalizedIds) {
    const rate = dirtyDirRates[id];
    if (!rate) continue;
    collected.push(enhanceRate(id, rate));
    used.add(id);
  }

  if (collected.length < Object.keys(dirtyDirRates).length) {
    for (const [id, rate] of Object.entries(dirtyDirRates)) {
      if (used.has(id)) continue;
      collected.push(enhanceRate(id, rate));
    }
  }

  return collected;
};

export const mylog = (
  message: string,
  color:
    | "error"
    | "success"
    | "warning"
    | "important"
    | "info"
    | "hidden" = "info"
) => {
  const colors = {
    error: "📕 \u001b[1;31m",
    success: "📗 \u001b[1;32m",
    warning: "📙 \u001b[1;33m",
    info: "📘 \u001b[1;34m",
    hidden: "📓 \u001b[1;30m",
    important: "📔 \u001b[38;5;226m",
  };
  console.log(`${colors[color]} ${message}`);
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const waitSec = (s: number) =>
  new Promise((resolve) => setTimeout(resolve, s * 1000));

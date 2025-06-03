import { getObject } from "./redis";
import { ICity } from "./types";
import { ISelectorCountry } from "./types/localTypes";
import { IAllDirtyRates, IRate, IRatesID } from "./types/rates";
import { cache } from "./index";

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
  dir: string,
  cities?: ICity[],
  allDirtyRates?: IAllDirtyRates
): ISelectorCountry[] {
  // Group cities by country
  const groupedByCountry: Record<string, ISelectorCountry> = {};

  if (!cities || !allDirtyRates) return [];
  for (const city of cities) {
    const totalCityRates = Object.values(allDirtyRates?.[dir])?.filter(
      (r) =>
        r.cityRates &&
        Object.keys(r.cityRates).find(
          (cityName) => cityName.toLowerCase() == city.en_name.toLowerCase()
        )
    ).length;

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

    // Add city to the country's cities array
    groupedByCountry[countryKey].cities.push({
      en_name: city.en_name,
      ru_name: city.ru_name,
      population: city.population,
      totalCityRates,
    });

    // Update the weight (sum of populations)
  }

  // Convert grouped data into an array
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
      console.log(`Got cache: ${key} | ${ttl / 1000}s`);
      return cached.data; // Return cached response
    }
  }
  const data = await getData();
  cache.set(key, { data, timestamp: now });
  console.log(`Set cache: ${key} | ${ttl / 1000}s`);
  return data;
};

export const getCleanDirRates = async (
  dir: string,
  type: "all" | "part" = "part"
) => {
  const dirtyDirRates = (await getObject(`allDirtyRates:${dir}`)) as {
    [key: string]: IRate;
  };
  const ratesID = (await getObject(`allRatesID:${dir}`)) as IRatesID;
  const clean = ratesID?.[type]?.map((id) => dirtyDirRates?.[id]);

  console.log("ratesID?.[type]", ratesID?.[type]);
  return clean;
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

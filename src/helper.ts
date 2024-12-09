import { ICity } from "./types";
import { ISelectorCountry } from "./types/localTypes";
import { IAllDirsRates } from "./types/rates";

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
  cities?: ICity[],
  allDirRates?: IAllDirsRates
): ISelectorCountry[] {
  // Group cities by country
  const groupedByCountry: Record<string, ISelectorCountry> = {};

  if (!cities || !allDirRates) return [];
  for (const city of cities) {
    const cityHasRates = Object.entries(allDirRates).find(
      ([dir, rates]) =>
        dir.includes("CASH") &&
        rates &&
        Object.values(rates)?.find(
          (r) =>
            r.cityRates &&
            Object.keys(r.cityRates).find(
              (cityName) => cityName.toLowerCase() == city.en_name.toLowerCase()
            )
        )
    );
    if (!cityHasRates) continue;
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
  cache,
  key,
  ttl = 60 * 1000,
  getData,
}: {
  cache: Map<any, any>;
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

import { ICity } from "./types";
import { ISelectorCountry } from "./types/localTypes";

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

export function convertCitiesToSelector(cities?: ICity[]): ISelectorCountry[] {
  // Group cities by country
  const groupedByCountry: Record<string, ISelectorCountry> = {};
  if (!cities) return [];
  for (const city of cities) {
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

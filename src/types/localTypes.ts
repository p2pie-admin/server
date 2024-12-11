export interface ISelectorCountry {
  weight: number;
  en_country_name: string;
  ru_country_name: string;
  cities: ISelectorCity[];
}

export interface ISelectorCity {
  en_name: string;
  ru_name: string;
  population: number;
  totalCityRates: number;
}

import { IExchanger } from "./exchanger";
import { IRate } from "./rates";

export interface ICity {
  codes: string[];
  en_name: string;
  ru_name: string;
  population: number;
  coordinates: number[];
  preposition: string;
  closest_cities: { en_name: string; ru_name: string }[];
  en_country_name: string;
  ru_country_name: string;
}

export interface IParserSetting {
  pause_between_loops?: number;
  dirs_disabled?: string;
  cities?: ICity[];
  filter_options?: unknown;
  SD_applied_from?: number;
  SD_best_rates?: number;
  SD_worst_rates?: number;
  [key: string]: unknown;
}

export type Timeouts = {
  getRatesIn: number;
  expireIn: number;
  restartRatesHandlerIn: number;
};

export interface DirData {
  errors: { [key: string]: string[] };
  warnings: { [key: string]: string[] };
  times_visited: number;
}

export interface DB {
  jwt: string;
  dirs: { [key: string]: DirData }; // отслеживаем какие направления популярны
  topCodes: string[];
  parser_setting: IParserSetting;
  exchangers: IExchanger[];
  all_pm_codes_that_exist: string[][];
  alternative_pm_codes: string[][];
  possible_pairs: { [key: string]: string[] };
}

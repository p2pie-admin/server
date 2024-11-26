import { IPm } from "./selector";

export interface ILocation {
  en_country_name: string;
  ru_country_name?: string;
  en_city_name: string;
  ru_city_name?: string;
  code?: string;
}

export interface ICurrencyConverterRate {
  rate: number;
  giveToUSD: number;
  getToUSD: number;
}

export interface IUsersRate {
  rate: [string, number, number];
  min: [string, number, number];
  max: [string, number, number];
}

export interface IP2PDir {
  deleted: boolean;
  give?: IPm[];
  get?: IPm[];
  currencyConverterRate?: ICurrencyConverterRate;
  usersRate?: IUsersRate;
  mainCur?: string;
  secondaryCur?: string;
  expanded: boolean;
  toUsdRate?: number;
  defRate?: number;
  giveBiggerValueThanGet?: boolean;
}

export interface IP2PRegulation {
  id: string;
  en_title: string;
  ru_title: string;
  en_description: string;
  ru_description: string;
  default_checked: boolean;
  has_article: boolean;
}

export type IP2PRegulationCodes = { [key: string]: boolean };

export interface IP2PRegulationGroup {
  id: string;
  en_title: string;
  ru_title: string;
  regulations: IP2PRegulation[];
}

export interface IP2PStep {
  en_title: string;
  ru_title: string;
  en_description: string;
  ru_description: string;
  en_stepper_title: string;
  ru_stepper_title: string;
  en_stepper_description: string;
  ru_stepper_description: string;
  component: any;
}

export interface IOrder {
  uid: string;
  ip?: string;
  name?: string;
  status?: "active" | "suspended" | "disabled";
  info?: string;
  dirs?: IP2PDir[];
  regulationCodes?: IP2PRegulationCodes;
  locations?: ILocation[];
}

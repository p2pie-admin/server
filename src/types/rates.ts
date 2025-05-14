import { ICity } from ".";

export type Sides = "give" | "get";
export type Limit = { [key in Sides]: number };

export interface IGeneralData {
  dirsDisabled: string;
  allPmCodesThatExist: string[];
  alternativePmCodes: string[][];
  cities: ICity[];
}

export interface LinkAndID {
  exchangerId: string;
  ratesLink: string;
}

export interface IRate {
  exchangerId?: string;
  name: string;
  tag: string;
  admin_rating: number | null;
  course: number;
  p2pRatio?: number;
  min_fee?: string;
  from_fee?: string;
  to_fee?: string;
  min: Limit;
  max: Limit;
  reserve: Limit;
  parameterCodes?: string[];
  cityRates?: { [key: string]: IRate };
  ref_link?: string;
  last_time_updated?: number;
}

export type ExchangerId = string;

export type IAllDirsRates = { [key: string]: { [key: string]: IRate } };
export type IAllDirsTops = { [key: string]: IRate[] };

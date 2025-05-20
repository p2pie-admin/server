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

export type IAllRatesID = { [key: string]: IRatesID };
// мы достаем для каждого направления айдишники обменников для просто всех отфильтрованных курсов и для части лучших

export type IRatesID = {
  all: string[];
  part: string[];
};

export type IAllDirtyRates = { [key: string]: { [key: string]: IRate } };
// пример:
let example = `LTC_CASHUSD": {
                "859": {
                  "exchangerId": 859,
                  "name": "CryptoBox",
                  "admin_rating": 4.23,
                  "logo": {
                    "url": "/uploads/cryptobox_007f6697f4.jpg"
                  },
                  "course": 0.009589379894150383,
                  "min": {
                    "give": 47.9469,
                    "get": 5000.000055191064
                  },
                  "max": {
                    "give": 7797.7193334871135,
                    "get": 813162
                  },
                  "reserve": {
                    "give": 7797.7193334871135,
                    "get": 813162
                  },
                  "ref_link": "https://cryptobox.pro/",
                  "cityRates": { },
                  "last_time_updated": 1747203258316
     `;

export interface IPmPointer {
  id: string;
  code: string;
  pm_group: IPmGroup;
  popular_as?: string;
}

interface IPmGroup {
  en_name: string;
  ru_name?: string;
  prefix?: string;
  icon?: IImage;
  color: string;
  options: IOption[];
}

interface IImage {
  id: string;
  url: string;
  alternativeText: string;
}

interface IOption {
  name?: string;
  code?: string;
  currency: ICurrency;
}

interface ICurrency {
  id: string;
  code: string;
  accuracy: string;
}

export interface IPopularDirs {
  [key: string]: {
    buy: string[];
    sell: string[];
  };
}

export interface IPopularDirRates {
  [key: string]: {
    buy: { [key: string]: number };
    sell: { [key: string]: number };
  };
}

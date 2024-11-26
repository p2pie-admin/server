export type IErrorCode =
  | "no-rates"
  | "ENOTFOUND"
  | "ECONNREFUSED"
  | "ECONNRESET"
  | "ETIMEDOUT"
  | "EPERM"
  | "ECONNABORTED"
  | "CERT_HAS_EXPIRED"
  | "ERR_FR_TOO_MANY_REDIRECTS"
  | "307"
  | "403"
  | "404"
  | "500"
  | "503"
  | "522"
  | "json-parsing-error"
  | "data-error"
  | "exchanger-custom-error"
  | "unknown";
/**
 * Model definition for exchanger
 */
export type Logo = {
  alternativeText: string;
  url: string;
};

export type IExchangerStatus = "active" | "suspended" | "disabled";

export interface IExchangerParsingError {
  comment?: string;
  autoMessage?: string;
  code?: IErrorCode;
  codeExplanation?: string;
}

export interface IExchangerParsingInfo {
  rates: number;
  comment?: string;
}

export type IExchanger = {
  name: string;
  id: string;
  status: IExchangerStatus;
  rates_link: string;
  ref_link?: string;
  tag?: string | null;
  logo?: Logo;
  total_rates?: number;
  admin_rating?: number;
  skip?: number;
  error?: IExchangerParsingError;
  info?: IExchangerParsingInfo;
  warnings?: { [key: string]: string };
};

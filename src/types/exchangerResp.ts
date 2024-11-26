type RateField = {
  _text: string;
};

interface IRateData {
  from: RateField;
  to: RateField;
  in: RateField;
  out: RateField;
  amount: RateField;
  minamount: RateField;
  maxamount: RateField;
  minfee?: RateField;
  fromfee?: RateField;
  tofee?: RateField;
  param?: RateField;
  city?: RateField;
  cityRatesData?: { [key: string]: IRateData };
}

interface ExchangerResponse {
  _declaration?: {
    _attributes: {
      version: string;
      encoding: string;
    };
  };
  error?: {
    _text: string;
  };
  rates?: {
    item: IRateData[];
  };
}

type ID = string;

interface AllExchangerResponses {
  [key: ID]: ExchangerResponse;
}

//type ErrorCode = "no-internet" | "404" | "json-parsing-error"| "data-error" | "no-rates" | "error-response" | "no-permission" | "unknown-error"

export { AllExchangerResponses, ExchangerResponse, IRateData, RateField };

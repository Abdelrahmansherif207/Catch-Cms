type LocalizedField = { en: string; ar: string };

export interface Currency {
  id: number;
  code: string;
  name: LocalizedField;
  symbol: LocalizedField;
  country_name: LocalizedField;
  numeric_code: string;
  decimal_places: number;
  icon: string;           // ISO country code, e.g. "us", "kw"
  is_active: boolean;
  is_base: boolean;
  is_catalog: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRate {
  id: number;
  currency_id: number;
  effective_date: string;
  exchange_rate: number;  // > 0
}

// API Responses
export interface CurrenciesListResponse {
  status: number;
  message: string;
  success: boolean;
  data: {
    data: Currency[];
    current_page: number;
    from: number;
    to: number;
    last_page: number;
    path: string;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string;
    last_page_url: string;
  };
}

export interface CurrencyDetailResponse {
  status: number;
  message: string;
  success: boolean;
  data: Currency;
}

export interface ExchangeRatesListResponse {
  status: number;
  message: string;
  success: boolean;
  data: {
    data: ExchangeRate[];
    current_page: number;
    from: number;
    to: number;
    last_page: number;
    path: string;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string;
    last_page_url: string;
  };
}
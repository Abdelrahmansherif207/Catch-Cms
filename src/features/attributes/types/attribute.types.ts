export interface AttributeValue {
  id: number;
  value: string;
  attribute_id: number;
  slug?: string;
  meta?: null;
}

export interface Attribute {
  id: number;
  name: string;
  slug: string;
  shop_id?: number | null;
  values?: AttributeValue[];
}

export interface AttributeListResponse {
  status: number;
  message: string;
  success: boolean;
  data: {
    data: Attribute[];
    current_page: number;
    from: number;
    to: number;
    last_page: number;
    path: string;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    last_page_url: string;
    first_page_url: string;
  };
}

export interface AttributeDetailResponse {
  status: number;
  message: string;
  success: boolean;
  data: Attribute;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export interface Shop {
  id: number;
  name: string;
  slug: string;
  description: string;
  cover_image: string;
  logo: string;
  status: boolean;
  address: ShopAddress[];
  created_at: string;
}

export interface ShopAddress {
  city: string;
  state: string;
  country: string;
  street_address: string;
}

export interface ShopsListResponse {
  data: {
    data: Shop[];
    links: unknown;
  };
  message: string;
  status: number;
  success: boolean;
}

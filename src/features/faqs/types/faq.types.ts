export interface Faq {
  id: number;
  faq_title: string;
  slug: string;
  faq_description: string;
  faq_type: string;
  issued_by: string | null;
  status: boolean;
  order: number;
}

export interface FaqsListOriginal {
  data: Faq[];
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
}

export interface FaqsListResponse {
  status: number;
  message: string;
  success: boolean;
  data: FaqsListOriginal;
}

export interface FaqDetailResponse {
  status: number;
  message: string;
  success: boolean;
  data: Faq;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export interface CreateFaqData {
  faq_title: { en: string; ar: string };
  faq_description: { en: string; ar: string };
}

export interface UpdateFaqData {
  faq_title?: { en: string; ar: string };
  faq_description?: { en: string; ar: string };
}

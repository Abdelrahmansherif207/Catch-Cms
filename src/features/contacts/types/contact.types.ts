export interface Contact {
  id: number;
  email: string;
  subject: string;
  message: string;
  is_read: boolean | number;
  is_replay: boolean | number;
  created_at: string;
}

export interface ContactPagination {
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

export interface ContactListResponse {
  status: number;
  message: string;
  success: boolean;
  data: ContactPagination & { data: Contact[] };
}

export interface ContactDetailResponse {
  status: number;
  message: string;
  success: boolean;
  data: Contact;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

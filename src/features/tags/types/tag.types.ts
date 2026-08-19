export interface Tag {
  id: number;
  name: string;
  slug: string;
  image: string;
  icon: string;
}

export interface TagsListData {
  data: Tag[];
  page: number;
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

export interface TagsListResponse {
  status: number;
  message: string;
  success: boolean;
  data: TagsListData;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export interface CreateTagData {
  name: string;
  slug?: string;
  image?: File;
  icon?: File;
}

export interface UpdateTagData extends CreateTagData {
  _method: 'PUT';
}

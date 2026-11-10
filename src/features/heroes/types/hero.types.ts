// ─── Hero resource admin (`/hero`) ───────────────────────────────

export type HeroType = 'image' | 'video';

export interface HeroMedia {
  id: number;
  url: string;
  thumb_url: string | null;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type: string;
  size: number;
}

export interface Hero {
  id: number;
  type: HeroType | string;
  /** String (list) or object {en, ar} (detail) — parse defensively. */
  description: string;
  /** Object form returned by detail endpoints. */
  description_translations?: Record<string, string>;
  is_active: boolean;
  media: HeroMedia | null;
  created_at: string;
  updated_at: string;
}

export interface HeroListData {
  data: Hero[];
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

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export type HeroesListResponse = ApiResponse<HeroListData>;
export type HeroDetailResponse = ApiResponse<Hero>;

// ─── Payloads ────────────────────────────────────────────────────

export interface CreateHeroData {
  type: HeroType;
  media: File;
  'description[en]'?: string;
  'description[ar]'?: string;
  /** '1' | '0' — activating one hero deactivates the others (backend). */
  is_active: string;
}

export interface UpdateHeroData {
  _method: 'PUT';
  type?: HeroType;
  media?: File;
  'description[en]'?: string;
  'description[ar]'?: string;
  is_active?: string;
}

export interface FetchHeroesParams {
  page?: number;
  perPage?: number;
  isActive?: boolean;
  type?: HeroType | 'all';
}

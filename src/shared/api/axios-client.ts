import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from '@/shared/constants/api';
import { getStoredLanguage } from './language-utils';

export interface ApiErrorResponse {
  status: number;
  message: string;
  success: boolean;
  errors?: Record<string, string[]>;
}

export function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as ApiErrorResponse).status === 'number' &&
    typeof (error as ApiErrorResponse).message === 'string'
  );
}

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const language = getStoredLanguage();
    config.headers['lang'] = language;

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<unknown>) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }

      const errors = extractValidationErrors(data);
      const message =
        (data as ApiErrorResponse)?.message ||
        firstValidationMessage(errors) ||
        'An unexpected error occurred';

      const apiError: ApiErrorResponse = {
        status,
        message,
        success: false,
        errors,
      };

      return Promise.reject(apiError);
    }

    if (error.request) {
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
        success: false,
      } as ApiErrorResponse);
    }

    return Promise.reject({
      status: 0,
      message: error.message || 'An unexpected error occurred',
      success: false,
    } as ApiErrorResponse);
  }
);

export default axiosClient;

// ─── Validation error normalization ─────────────────────────────
// Static-pages contract returns 422 as a FLAT map with no `errors`
// wrapper and no `message`: `{ "title.en": ["..."] }`.
// Laravel default is `{ message, errors: {...} }`. Support both so
// feature dialogs keep working regardless of backend shape.
const RESERVED_ERROR_KEYS = new Set(['status', 'message', 'success', 'data', 'meta', 'errors']);

function toStringArray(value: unknown): string[] | null {
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    return value as string[];
  }
  if (typeof value === 'string') return [value];
  return null;
}

function extractValidationErrors(data: unknown): Record<string, string[]> | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const obj = data as Record<string, unknown>;

  if (obj.errors && typeof obj.errors === 'object') {
    const normalized: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(obj.errors as Record<string, unknown>)) {
      const arr = toStringArray(value);
      if (arr) normalized[key] = arr;
    }
    return Object.keys(normalized).length > 0 ? normalized : undefined;
  }

  const flat: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (RESERVED_ERROR_KEYS.has(key)) continue;
    const arr = toStringArray(value);
    if (arr) flat[key] = arr;
  }
  return Object.keys(flat).length > 0 ? flat : undefined;
}

function firstValidationMessage(errors: Record<string, string[]> | undefined): string | undefined {
  if (!errors) return undefined;
  for (const messages of Object.values(errors)) {
    if (messages.length > 0) return messages[0];
  }
  return undefined;
}

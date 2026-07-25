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
    config.headers['Accept-Language'] = language;

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
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }

      const apiError: ApiErrorResponse = {
        status,
        message: data?.message || 'An unexpected error occurred',
        success: false,
        errors: data?.errors,
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

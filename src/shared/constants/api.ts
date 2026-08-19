export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const API_TIMEOUT = 30000;

export const STORAGE_KEYS = {
  TOKEN: "auth_token",
  LANGUAGE: "language",
} as const;

export const DEFAULT_LANGUAGE = "ar";
export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const API_TIMEOUT = 30000;
// No client-side abort for long-running import/export file operations.
// Axios treats `timeout: 0` as "never abort" — the request stays open until
// the server responds, the network fails, or the user navigates away.
export const NO_TIMEOUT = 0;

export const STORAGE_KEYS = {
  TOKEN: "auth_token",
  LANGUAGE: "language",
} as const;

export const DEFAULT_LANGUAGE = "ar";
export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

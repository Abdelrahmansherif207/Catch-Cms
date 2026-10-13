import type { ApiResponse } from '../types/product.types';

/**
 * Digital asset delivery types served by the backend registry.
 * Verified live: absent `type` defaults to FILE on create.
 */
export type DigitalAssetType = 'FILE' | 'URL' | 'ACCESS' | 'LICENSE';

/**
 * One digital deliverable attached to a DIGITAL product.
 * Shape captured from GET /products/{id}/digital-assets:
 * - `external_url` appears ONLY on URL assets.
 * - ACCESS/LICENSE assets never expose their content (secret/keys are
 *   write-only); size is always 0 and mime is text/plain for them.
 * - No download/file URL is returned for FILE assets (metadata only).
 */
export interface DigitalAsset {
  id: number;
  uuid: string;
  type: DigitalAssetType;
  original_name: string;
  display_name: string | null;
  mime: string;
  size: number;
  sort_order: number;
  external_url?: string;
  created_at: string;
  updated_at: string;
}

export type DigitalAssetListResponse = ApiResponse<DigitalAsset[]>;
export type DigitalAssetResponse = ApiResponse<DigitalAsset>;
export type DeleteDigitalAssetResponse = ApiResponse<null>;

/**
 * License key provisioning result (POST /digital-assets/{uuid}/license-keys).
 * Plaintext keys NEVER come back — counts only. Duplicates/blank keys
 * consumed by the pool are reported through the skipped_* counters.
 */
export interface LicenseKeyResult {
  asset_uuid: string;
  created: number;
  skipped_blank: number;
  skipped_duplicate: number;
}

export type LicenseKeyResultResponse = ApiResponse<LicenseKeyResult>;

/**
 * Client-side draft for an asset collected in the create-product form.
 * The backend can only attach assets to an existing product, so these
 * rows are buffered locally and flushed after the product is created.
 */
export interface PendingDigitalAsset {
  localId: string;
  type: DigitalAssetType;
  file?: File;
  external_url?: string;
  secret?: string;
  /**
   * LICENSE pools only: keys typed at add-time. They are NOT sent on the
   * create call (backend attaches pools empty) — the flush provisions them
   * in the follow-up license-keys call right after the pool uuid exists.
   */
  keys?: string[];
  /** Optional preview metadata: original_name is derived at buffer time */
  /** (FILE → file name, URL → URL, ACCESS/LICENSE → server defaults) and */
  /** size mirrors file.size for FILE drafts. */
  original_name?: string;
  size?: number;
}

/** Registry-allowed extensions probed from the live 422 error message. */
export const DIGITAL_ASSET_EXTENSIONS = [
  'pdf',
  'mp3',
  'wav',
  'm4a',
  'aac',
  'ogg',
  'flac',
  'mp4',
  'webm',
  'mov',
  'mkv',
] as const;

/** Server-side cap probed live: files rejected above 20480 kilobytes. */
export const DIGITAL_ASSET_MAX_SIZE_BYTES = 20480 * 1024;

/** License batch cap probed live: 500 keys per call. */
export const LICENSE_KEYS_MAX_BATCH = 500;

/** Per-key char cap (backend rule keys.* max:2000). */
export const LICENSE_KEY_MAX_LENGTH = 2000;

/** Anchored payload when attaching a new asset to a product. */
export interface CreateDigitalAssetPayload {
  type: DigitalAssetType;
  /** Required on the FILE branch (the default branch when `type` is omitted). */
  file?: File;
  /** Required on the URL branch; must be a resolvable HTTPS address. */
  external_url?: string;
  /** Required on the ACCESS branch; stored encrypted and never returned. */
  secret?: string;
}

/** Multipart file-picker accept string built from the probed registry. */
export const DIGITAL_ASSET_ACCEPT = DIGITAL_ASSET_EXTENSIONS.map((ext) => `.${ext}`).join(',');

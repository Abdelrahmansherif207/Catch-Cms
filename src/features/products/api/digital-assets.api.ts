import { axiosClient } from '@/shared/api';
import type {
  CreateDigitalAssetPayload,
  DigitalAssetListResponse,
  DigitalAssetResponse,
  DeleteDigitalAssetResponse,
  LicenseKeyResultResponse,
} from '../types/digital-asset.types';

/**
 * Digital asset endpoints (all contracts verified live against the API):
 *
 *  GET    /products/{productId}/digital-assets        → list assets of a product
 *  POST   /products/{productId}/digital-assets        → attach one asset (multipart)
 *  POST   /digital-assets/{uuid}/replace              → swap FILE bytes (multipart)
 *  POST   /digital-assets/{uuid}/license-keys         → provision keys into a LICENSE pool
 *  DELETE /digital-assets/{uuid}                      → remove an asset
 *
 * The flat /digital-assets list and single-asset GET do not exist (404),
 * and license-keys has no read route (405) — assets are always read
 * through the product.
 */

/** File-picker accept string exported for the dialogs. */
export { DIGITAL_ASSET_ACCEPT } from '../types/digital-asset.types';

/**
 * Attach an asset to a DIGITAL product as multipart/form-data — the same
 * transport serves every branch (file is FILE-branch only, external_url
 * URL, secret ACCESS, anything LICENSE).
 */
export async function createDigitalAsset(
  productId: number,
  payload: CreateDigitalAssetPayload,
): Promise<DigitalAssetResponse> {
  const formData = new FormData();
  formData.append('type', payload.type);
  if (payload.file) formData.append('file', payload.file);
  if (payload.external_url) formData.append('external_url', payload.external_url);
  if (payload.secret) formData.append('secret', payload.secret);

  const { data } = await axiosClient.post<DigitalAssetResponse>(
    `/products/${productId}/digital-assets`,
    formData,
  );
  return data;
}

/** Swap the bytes of a FILE asset while keeping its uuid identity. */
export async function replaceDigitalAsset(uuid: string, file: File): Promise<DigitalAssetResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axiosClient.post<DigitalAssetResponse>(
    `/digital-assets/${uuid}/replace`,
    formData,
  );
  return data;
}

/** Bulk-provision encrypted license keys into a LICENSE pool (counts only). */
export async function addDigitalLicenseKeys(
  uuid: string,
  keys: string[],
): Promise<LicenseKeyResultResponse> {
  const { data } = await axiosClient.post<LicenseKeyResultResponse>(
    `/digital-assets/${uuid}/license-keys`,
    { keys },
  );
  return data;
}

/**
 * Remove an asset (row + stored bytes when applicable).
 * NOTE: non-FILE deletes currently respond HTTP 500 even though the row
 * IS removed server-side — callers must verify via a fresh list fetch,
 * never treat a 500 as authoritative by itself.
 */
export async function deleteDigitalAsset(uuid: string): Promise<DeleteDigitalAssetResponse> {
  const { data } = await axiosClient.delete<DeleteDigitalAssetResponse>(`/digital-assets/${uuid}`);
  return data;
}

/** Read the assets attached to a product (sorted by sort_order). */
export async function fetchDigitalAssets(productId: number): Promise<DigitalAssetListResponse> {
  const { data } = await axiosClient.get<DigitalAssetListResponse>(
    `/products/${productId}/digital-assets`,
  );
  return data;
}

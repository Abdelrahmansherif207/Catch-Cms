import { axiosClient } from '@/shared/api';
import type {
  DigitalEntitlement,
  EntitlementListFilters,
  EntitlementListResponse,
  EntitlementResponse,
  RevokeRestoreResponse,
} from '../types/digital-entitlement.types';
import type { EntitlementLimitResponse } from '../types/digital-entitlement.types';

/**
 * Digital entitlement endpoints (all contracts verified live):
 *
 *  GET   /digital-entitlements                → filtered+paginated list (relations loaded)
 *  GET   /digital-entitlements/{uuid}         → one ticket with user/product loaded
 *  POST  /digital-entitlements/{uuid}/revoke  → state → revoked (idempotent, always 200)
 *  POST  /digital-entitlements/{uuid}/restore → revoked → delivered (non-revoked = no-op 200)
 *  PATCH /digital-entitlements/{uuid}/limit   → override quota; receipts previous/new
 *
 * revoke/restore send NO body; limit takes {limit: n} where absent/null = unlimited.
 * Mutation responses never carry user/product relations.
 */

function buildQuery(filters: EntitlementListFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', String(filters.page));
  if (filters.per_page) params.append('per_page', String(filters.per_page));
  if (filters.uuid) params.append('uuid', filters.uuid);
  if (filters.status) params.append('status', filters.status);
  if (filters.order_id) params.append('order_id', String(filters.order_id));
  if (filters.user_id) params.append('user_id', String(filters.user_id));
  if (filters.search) params.append('search', filters.search);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchEntitlements(
  filters: EntitlementListFilters = {},
): Promise<EntitlementListResponse> {
  const { data } = await axiosClient.get<EntitlementListResponse>(
    `/digital-entitlements${buildQuery(filters)}`,
  );
  return data;
}

export async function fetchEntitlement(uuid: string): Promise<EntitlementResponse> {
  const { data } = await axiosClient.get<EntitlementResponse>(`/digital-entitlements/${uuid}`);
  return data;
}

/** Idempotent: replaying an already-revoked ticket returns the same 200. */
export async function revokeEntitlement(uuid: string): Promise<RevokeRestoreResponse> {
  const { data } = await axiosClient.post<RevokeRestoreResponse>(
    `/digital-entitlements/${uuid}/revoke`,
  );
  return data;
}

/** Idempotent: restoring a non-revoked ticket is a no-op, still 200. */
export async function restoreEntitlement(uuid: string): Promise<RevokeRestoreResponse> {
  const { data } = await axiosClient.post<RevokeRestoreResponse>(
    `/digital-entitlements/${uuid}/restore`,
  );
  return data;
}

/**
 * Override the download cap. `null` = unlimited — sent as an ABSENT key
 * (explicit null behaves identically server-side, verified).
 */
export async function setEntitlementLimit(
  uuid: string,
  limit: number | null,
): Promise<EntitlementLimitResponse> {
  const body = limit === null ? {} : { limit };
  const { data } = await axiosClient.patch<EntitlementLimitResponse>(
    `/digital-entitlements/${uuid}/limit`,
    body,
  );
  return data;
}

export type { DigitalEntitlement, EntitlementLimitResponse };

/** Same generic envelope used across the app (products module definition). */
export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

/**
 * Digital entitlement = the customer's access ticket born from digital-order
 * fulfillment. Contract captured from live curls (cycle fully exercised):
 *
 * - status machine: pending → delivered → revoked (restore: revoked →
 *   delivered ONLY; non-revoked restore is an idempotent no-op, always 200)
 * - download_limit 0 === unlimited; `unlimited` mirrors it
 * - list/show responses EAGER-LOAD `user` + `product`; revoke/restore/limit
 *   responses ALWAYS omit relations (verified asymmetry)
 */
export type EntitlementStatus = 'pending' | 'delivered' | 'revoked';

export interface EntitlementOwner {
  id: number;
  name: string;
  email: string;
}

export interface EntitlementProduct {
  id: number;
  name: string;
}

export interface DigitalEntitlement {
  uuid: string;
  status: EntitlementStatus;
  download_limit: number;
  unlimited: boolean;
  download_count: number;
  delivered_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  order_id: number;
  order_product_id: number;
  user?: EntitlementOwner;
  product?: EntitlementProduct;
  created_at: string | null;
}

/** Custom page envelope: {data: [...], meta} — NOT the products links shape. */
export interface EntitlementPageMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface EntitlementListFilters {
  uuid?: string;
  status?: EntitlementStatus | '';
  order_id?: number | '';
  user_id?: number | '';
  search?: string;
  per_page?: number;
  page?: number;
}

export type EntitlementListResponse = ApiResponse<{
  data: DigitalEntitlement[];
  meta: EntitlementPageMeta;
}>;
export type EntitlementResponse = ApiResponse<DigitalEntitlement>;
export type RevokeRestoreResponse = ApiResponse<DigitalEntitlement>;
export type DeleteEntitlementResponse = ApiResponse<null>;

/** Receipt returned by PATCH /limit (NOT the full resource — verified). */
export interface EntitlementLimitReceipt {
  uuid: string;
  previous_limit: number;
  download_limit: number;
  unlimited: boolean;
}

export type EntitlementLimitResponse = ApiResponse<EntitlementLimitReceipt>;

/** Backend bounds verified via live 422s (min 0 max 4294967295). */
export const ENTITLEMENT_LIMIT_MAX = 4294967295;

/** Receipt returned by PATCH /limit is used for one-click undo (previous_limit). */
export type { EntitlementLimitReceipt as LimitReceiptSnapshot };

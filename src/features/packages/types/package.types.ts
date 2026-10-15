/** Server-closed package lifecycle (live-verified: open/sealed/voided seeded). */
export const PACKAGE_STATUSES = [
  'open',
  'sealed',
  'voided',
  'handed_off',
] as const;

export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

export function isPackageStatus(value: unknown): value is PackageStatus {
  return (
    typeof value === 'string' &&
    (PACKAGE_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * Index row (GET /admin/packages?fulfillment_id=X) — flat array. NO items
 * array / dimensions / notes here; carries the pre-counted `item_count`.
 */
export interface PackageListItem {
  id: number;
  fulfillment_id: number;
  packing_task_id: number | null;
  package_number: string;
  barcode: string | null;
  status: PackageStatus | string;
  weight: number | null;
  item_count: number;
  sealed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Item line inside the detail `items` array. */
export interface PackageDetailItem {
  id: number;
  fulfillment_item_id: number;
  order_item_id: number | null;
  quantity: number;
}

/**
 * Detail (GET /admin/packages/{id}) — live-verified keys. Voided rows keep
 * their items (audit) but are excluded from verify quantity math.
 */
export interface PackageDetail {
  id: number;
  fulfillment_id: number;
  packing_task_id: number | null;
  package_number: string;
  barcode: string | null;
  status: PackageStatus | string;
  weight: number | null;
  dimensions: Record<string, number> | null;
  notes: string | null;
  items: PackageDetailItem[];
  sealed_at: string | null;
  handed_off_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PackagesListResponseData {
  status: number;
  message: string;
  success: boolean;
  data: PackageListItem[];
}

export interface PackageDetailResponseData {
  status: number;
  message: string;
  success: boolean;
  data: PackageDetail;
}

export interface FetchPackagesParams {
  /** Required server-side — the index is fulfillment-scoped. */
  fulfillmentId: number;
  /** Unknown fulfillment ids 422 (exists rule on the index filter). */
  limit?: number;
}

export interface CreatePackageData {
  fulfillment_id: number;
}

export interface AddPackageItemData {
  /** Ghost ids → 422 framework text (no exists rule, lookup in-service). */
  fulfillment_item_id: number;
  /** > 0 and ≤ picked − already packed (over-pack 422s otherwise). */
  quantity: number;
}

/**
 * Seal accepts an optional weight/dimensions override, but the packer flow
 * sends an EMPTY body — the pack step already stamped both on the task and
 * the seal retains them.
 */
export type SealPackageData = Record<string, never>;

export interface VoidPackageData {
  /** Whitespace-only passes validation then 422s at the service. */
  reason: string;
}

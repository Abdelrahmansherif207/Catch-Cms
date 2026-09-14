/**
 * Normalizes the mixed Active/Inactive representations returned by the API
 * (boolean true/false, int 1/0, or string "1"/"0") into a plain boolean.
 *
 * Plain `Boolean(value)` is wrong here: `Boolean("0") === true`, so an
 * Inactive record serialized as the string "0" would read as Active.
 */
export function isActiveStatus(value: unknown): boolean {
  if (value === true || value === 1 || value === '1') return true;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === 'active') return true;
    return false;
  }
  return false;
}

/** Canonical API payload value for an Active/Inactive form state. */
export function toStatusPayload(isActive: boolean): 0 | 1 {
  return isActive ? 1 : 0;
}

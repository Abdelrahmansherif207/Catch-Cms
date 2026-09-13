/** Generate one `Idempotency-Key` per intentional start/retry action. */
export function newIdempotencyKey(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function idempotencyHeaders(key: string): Record<string, string> {
  // Backend checks both spellings (§22).
  return { 'Idempotency-Key': key, 'X-Idempotency-Key': key };
}

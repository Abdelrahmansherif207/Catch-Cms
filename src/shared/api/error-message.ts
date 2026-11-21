/**
 * Extract a human-readable message from anything thrown by the API layer.
 *
 * The axios interceptor rejects with `ApiErrorResponse` ({ status, message,
 * success, errors }), so surfacing `message` shows the backend's real text
 * (e.g. "User does not have the required permissions.") instead of a generic
 * "Something went wrong".
 */
export function getApiErrorMessage(error: unknown, fallback?: string): string | undefined {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

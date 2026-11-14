import { ApiRequestError } from "@/services/api/ApiRequestError";

/**
 * Tries the real endpoint first. If it 404s (route not implemented yet) or
 * the backend is unreachable (network error, no `status`), silently serves
 * the static/mock fallback instead of surfacing an error — so pages keep
 * working before the corresponding backend module ships. Any other error
 * (validation, auth, 500, ...) means the endpoint exists and genuinely
 * failed, so it propagates normally.
 */
export async function callWithFallback<T>(
  apiCall: () => Promise<T>,
  fallback: () => Promise<T> | T,
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (error instanceof ApiRequestError && (error.status === 404 || error.status === undefined)) {
      return await fallback();
    }
    throw error;
  }
}

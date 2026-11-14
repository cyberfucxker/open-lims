/** `{status, message, data}` envelope — matches api.md / the existing
 *  Flutter client's parsing exactly. Deliberately distinct from
 *  `ApiResponse` (`{success, message, data}`) used by the internal
 *  admin/franchise API: the Flutter app's parsing code is a fixed external
 *  contract we don't control, so the two namespaces intentionally diverge. */
export interface AppApiResponseBody<T = unknown> {
  status: boolean;
  message: string;
  data: T | null;
  meta?: Record<string, unknown>;
}

export class AppApiResponse {
  static success<T>(
    message: string,
    data: T | null = null,
    meta?: Record<string, unknown>,
  ): AppApiResponseBody<T> {
    return { status: true, message, data, meta };
  }

  static error(message: string, details?: unknown): AppApiResponseBody<null> {
    return { status: false, message, data: null, meta: details ? { details } : undefined };
  }
}

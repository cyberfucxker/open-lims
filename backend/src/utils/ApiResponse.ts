export interface ApiResponseBody<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  meta?: Record<string, unknown>;
}

export class ApiResponse {
  static success<T>(
    message: string,
    data: T | null = null,
    meta?: Record<string, unknown>,
  ): ApiResponseBody<T> {
    return { success: true, message, data, meta };
  }

  static error(message: string, details?: unknown): ApiResponseBody<null> {
    return { success: false, message, data: null, meta: details ? { details } : undefined };
  }
}

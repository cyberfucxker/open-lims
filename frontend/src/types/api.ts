/** Mirrors the backend's ApiResponse envelope (backend/src/utils/ApiResponse.ts). */
export interface ApiResponseBody<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  meta?: {
    details?: Array<{ field?: string; message: string }>;
    [key: string]: unknown;
  };
}

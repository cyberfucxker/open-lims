export interface AppApiResponseBody<T> {
  status: boolean;
  message: string;
  data: T | null;
  meta?: Record<string, unknown>;
}

export interface PagedMeta {
  page: number;
  limit: number;
  total: number;
}

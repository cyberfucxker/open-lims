export interface ApiFieldError {
  field?: string;
  message: string;
}

/** Normalized shape every failed real-API request rejects with — the
 *  "Phase 2" counterpart to `mocks/error.ts#MockApiError`, matching the
 *  same `{status, message, data}` envelope the backend's `AppApiResponse`
 *  actually returns. */
export class ApiRequestError extends Error {
  readonly status?: number;
  readonly details?: ApiFieldError[];

  constructor(message: string, status?: number, details?: ApiFieldError[]) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }

  fieldMessage(field: string): string | undefined {
    return this.details?.find((d) => d.field === field)?.message;
  }
}

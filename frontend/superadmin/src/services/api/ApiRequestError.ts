export interface ApiFieldError {
  field?: string;
  message: string;
}

/** Normalized shape every failed request rejects with, regardless of cause. */
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

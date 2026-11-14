import { ApiError } from "../ApiError";

/** The Patient App client has been observed sending both `DD-MM-YYYY` and
 *  `DD/MM/YYYY` (confirmed live against the real client — a prior "dashes
 *  only" assumption here was contradicted by a real request using slashes),
 *  so both separators are accepted on input. Parsed as UTC midnight so no
 *  local timezone can shift the calendar date by a day. */
const DD_MM_YYYY = /^(\d{2})[-/](\d{2})[-/](\d{4})$/;

export function parseDDMMYYYY(value: string): Date {
  const match = DD_MM_YYYY.exec(value.trim());
  if (!match) {
    throw ApiError.badRequest("Date must be in DD-MM-YYYY or DD/MM/YYYY format");
  }
  const [, dd, mm, yyyy] = match;
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  if (Number.isNaN(date.getTime()) || date.getUTCDate() !== Number(dd)) {
    throw ApiError.badRequest("Invalid date");
  }
  return date;
}

export function toISODateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Output side of the same DD-MM-YYYY convention — every app-facing
 *  response that echoes a date of birth uses this, so the client always
 *  round-trips the same format it sends. */
export function formatDDMMYYYY(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${date.getUTCFullYear()}`;
}

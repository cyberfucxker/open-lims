import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { ApiError } from "./ApiError";

/** Parses an uploaded CSV file (as a Buffer) into plain objects keyed by the
 *  header row — used by every catalogue import endpoint (Tests, Packages,
 *  Parameters). `bom: true` strips a leading UTF-8 BOM (common when the file
 *  was saved from Excel), and blank/trailing rows are skipped so an
 *  accidental empty line at the end of the sheet doesn't surface as an
 *  error row. */
export function parseCsvBuffer(buffer: Buffer): Record<string, string>[] {
  try {
    return parse(buffer, {
      columns: true,
      trim: true,
      skip_empty_lines: true,
      bom: true,
    }) as Record<string, string>[];
  } catch {
    throw ApiError.badRequest("Could not read this file — make sure it's a valid CSV export.");
  }
}

/** Builds a CSV file (as a Buffer) from a fixed column order — same shape an
 *  Export produces, so a re-imported file always matches its own template. */
export function toCsvBuffer(headers: string[], rows: Record<string, unknown>[]): Buffer {
  const csv = stringify(rows, { header: true, columns: headers });
  return Buffer.from(csv, "utf-8");
}

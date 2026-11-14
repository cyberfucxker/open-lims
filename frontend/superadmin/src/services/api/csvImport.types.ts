/** Mirrors the backend's `CsvImportResult` shape, returned by every
 *  catalogue CSV import endpoint (Tests, Packages, Parameters). `row` is the
 *  1-based data row number (header excluded), matching what the user sees
 *  in Excel. */
export interface CsvImportResult {
  totalRows: number;
  insertedCount: number;
  updatedCount: number;
  errors: { row: number; message: string }[];
  /** Non-fatal: the row still imported, but with one or more referenced
   *  items silently skipped (e.g. a Parameter named in "Parameter IDs" that
   *  doesn't exist) — the row isn't in `errors`, it just imported with less
   *  than it asked for. */
  warnings?: { row: number; message: string }[];
}

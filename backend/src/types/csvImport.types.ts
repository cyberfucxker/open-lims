/** Shared result shape returned by every catalogue CSV import endpoint
 *  (Tests, Packages, Parameters) — `row` is the 1-based data row number
 *  (header excluded) so it lines up with what the user sees in Excel. */
export interface CsvImportResult {
  totalRows: number;
  insertedCount: number;
  updatedCount: number;
  errors: { row: number; message: string }[];
  /** Non-fatal: the row still imported, but with one or more referenced
   *  items silently skipped (e.g. a Test CSV's "Parameter IDs" naming a
   *  Parameter that doesn't exist) — surfaced so the admin can go add what's
   *  missing, rather than only ever finding out a row failed outright. */
  warnings?: { row: number; message: string }[];
}

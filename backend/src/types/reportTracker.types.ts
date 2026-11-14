/** Shapes for the Superadmin "Reports Delivery Tracker" — a different
 *  audience/DTO than the internal LIMS `report.types.ts#ReportListItem`,
 *  even though both read from the same `Report` table. */

export type ReportTrackerStatus = "not_uploaded" | "uploaded" | "downloaded";

export interface ReportTrackerItemDto {
  id: string;
  reportNo: string;
  customerName: string;
  testName: string;
  status: ReportTrackerStatus;
  collectedAt: string | null;
  /** Real elapsed turnaround — collection to ready (or now, if not ready yet). */
  tatHours: number | null;
  /** Flat 24h-from-collection SLA — there is no structured per-test SLA field today. */
  dueAt: string | null;
  slaBreached: boolean;
}

export interface ListReportTrackerParams {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  isEmergency?: boolean;
  status?: ReportTrackerStatus | "all";
  breachedOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ReportTrackerStatsDto {
  pendingUpload: number;
  uploadedNotDownloaded: number;
  downloaded: number;
  slaBreaches: number;
  avgTatHours: number;
}

export interface ListReportTrackerResult {
  rows: ReportTrackerItemDto[];
  total: number;
  stats: ReportTrackerStatsDto;
}

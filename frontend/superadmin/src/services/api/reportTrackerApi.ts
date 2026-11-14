import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

export type ReportTrackerStatus = "not_uploaded" | "uploaded" | "downloaded";

export interface ReportTrackerItem {
  id: string;
  reportNo: string;
  customerName: string;
  testName: string;
  status: ReportTrackerStatus;
  collectedAt: string | null;
  tatHours: number | null;
  dueAt: string | null;
  slaBreached: boolean;
}

export interface ReportTrackerStats {
  pendingUpload: number;
  uploadedNotDownloaded: number;
  downloaded: number;
  slaBreaches: number;
  avgTatHours: number;
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

export interface ListReportTrackerResult {
  rows: ReportTrackerItem[];
  total: number;
  stats: ReportTrackerStats;
}

export async function fetchReportTracker(
  params: ListReportTrackerParams = {},
): Promise<ListReportTrackerResult> {
  const response = await httpClient.get<ApiResponseBody<ListReportTrackerResult>>(
    "/report-tracker",
    { params, suppressErrorToast: true },
  );
  return response.data.data as ListReportTrackerResult;
}

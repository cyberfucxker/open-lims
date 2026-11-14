import * as reportRepository from "../repositories/report.repository";
import type { ReportWithListRelations } from "../repositories/report.repository";
import type {
  ListReportTrackerParams,
  ListReportTrackerResult,
  ReportTrackerItemDto,
  ReportTrackerStatus,
} from "../types/reportTracker.types";

const READY_STATUSES = new Set(["APPROVED", "SUBMITTED", "PRINTED"]);
const SLA_HOURS = 24;
const MS_PER_HOUR = 60 * 60 * 1000;

function earliestCollectedAt(report: ReportWithListRelations): Date | null {
  const dates = report.results
    .map((r) => r.sample?.collectedAt ?? null)
    .filter((d): d is Date => d != null);
  if (dates.length === 0) return null;
  return new Date(Math.min(...dates.map((d) => d.getTime())));
}

function toTrackerItem(report: ReportWithListRelations, now: Date): ReportTrackerItemDto {
  const status: ReportTrackerStatus = !READY_STATUSES.has(report.status)
    ? "not_uploaded"
    : report.auditLogs.length > 0
      ? "downloaded"
      : "uploaded";

  const collectedAt = earliestCollectedAt(report);
  const readyAt = report.submittedAt ?? report.approvedAt ?? null;
  const tatEndpoint = readyAt ?? now;

  const tatHours = collectedAt
    ? Math.round(((tatEndpoint.getTime() - collectedAt.getTime()) / MS_PER_HOUR) * 10) / 10
    : null;
  const dueAt = collectedAt ? new Date(collectedAt.getTime() + SLA_HOURS * MS_PER_HOUR) : null;
  const slaBreached = dueAt != null && tatEndpoint.getTime() > dueAt.getTime();

  return {
    id: report.id,
    reportNo: report.reportNo,
    customerName:
      `${report.appointment.patient.firstName} ${report.appointment.patient.lastName}`.trim(),
    testName: report.appointment.tests.map((t) => t.testName).join(", "),
    status,
    collectedAt: collectedAt ? collectedAt.toISOString() : null,
    tatHours,
    dueAt: dueAt ? dueAt.toISOString() : null,
    slaBreached,
  };
}

export async function listReportTracker(
  params: ListReportTrackerParams,
): Promise<ListReportTrackerResult> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;
  const now = new Date();

  const reports = await reportRepository.findAllForTracker({
    search: params.search,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    isEmergency: params.isEmergency,
  });

  const items = reports.map((r) => toTrackerItem(r, now));

  const stats = {
    pendingUpload: items.filter((i) => i.status === "not_uploaded").length,
    uploadedNotDownloaded: items.filter((i) => i.status === "uploaded").length,
    downloaded: items.filter((i) => i.status === "downloaded").length,
    slaBreaches: items.filter((i) => i.slaBreached).length,
    avgTatHours: (() => {
      const withTat = items.filter((i) => i.tatHours != null) as (ReportTrackerItemDto & {
        tatHours: number;
      })[];
      if (withTat.length === 0) return 0;
      return (
        Math.round((withTat.reduce((sum, i) => sum + i.tatHours, 0) / withTat.length) * 10) / 10
      );
    })(),
  };

  const filtered = items.filter((i) => {
    if (params.status && params.status !== "all" && i.status !== params.status) return false;
    if (params.breachedOnly && !i.slaBreached) return false;
    return true;
  });

  const start = (page - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  return { rows, total: filtered.length, stats };
}

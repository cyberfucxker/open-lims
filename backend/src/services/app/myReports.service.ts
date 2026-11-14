import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import type { ReportStatus } from "@prisma/client";

function toAppStatus(status: ReportStatus): "pending" | "processing" | "ready" {
  if (status === "APPROVED" || status === "SUBMITTED" || status === "PRINTED") return "ready";
  if (status === "PROCESSING" || status === "PARTIAL") return "processing";
  return "pending";
}

async function callerPatientIds(appUserId: string): Promise<string[]> {
  const familyMembers = await prisma.familyMember.findMany({
    where: { appUserId },
    select: { patientId: true },
  });
  return familyMembers.map((fm) => fm.patientId);
}

export interface ListMyReportsOptions {
  page: number;
  limit: number;
}

export async function listMyReports(appUserId: string, options: ListMyReportsOptions) {
  const patientIds = await callerPatientIds(appUserId);
  if (patientIds.length === 0) {
    return { reports: [], total: 0 };
  }

  const where = { appointment: { patientId: { in: patientIds } } };
  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: { appointment: { include: { appOrderAppointment: true, tests: true } } },
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.report.count({ where }),
  ]);

  return {
    reports: reports.map((report) => {
      const status = toAppStatus(report.status);
      return {
        id: report.id,
        reportId: report.reportNo,
        orderId: report.appointment.appOrderAppointment?.orderId ?? null,
        testName: report.appointment.tests.map((t) => t.testName).join(", "),
        bookingDate: report.appointment.appointmentDate.toISOString(),
        orderStatus: status,
        reportUrl: status === "ready" ? `/api/v1/app/user/reports/${report.id}/download` : null,
      };
    }),
    total,
  };
}

export async function assertReportAccessible(appUserId: string, reportId: string): Promise<void> {
  const patientIds = await callerPatientIds(appUserId);
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { appointment: true },
  });
  if (!report || !patientIds.includes(report.appointment.patientId)) {
    throw ApiError.notFound("Report not found");
  }
}

/** Powers the Reports Delivery Tracker's "downloaded" status — reuses the
 *  generic `ReportAuditLog` table rather than a dedicated column, same
 *  convention as the "CREATED" entry `labWorkflow.service.ts` writes. */
export async function logReportDownloaded(reportId: string): Promise<void> {
  await prisma.reportAuditLog.create({
    data: { reportId, action: "DOWNLOADED", note: "Downloaded via Patient App" },
  });
}

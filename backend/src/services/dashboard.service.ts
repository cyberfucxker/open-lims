import * as dashboardRepository from "../repositories/dashboard.repository";
import type { DateRangeParams, DashboardSummaryDto } from "../types/dashboard.types";

const TOP_LIST_LIMIT = 10;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Defaults to "today" (server local time) — this dashboard is framed around
 *  the front-desk's walking/registration activity for the day, same spirit
 *  as the "Total Billing (Walking)" card. Explicit dateFrom/dateTo (as sent
 *  by the period toggle) override that default. */
function resolveRange(params: DateRangeParams): { from: Date; to: Date } {
  if (params.dateFrom || params.dateTo) {
    const from = params.dateFrom ? new Date(params.dateFrom) : new Date(0);
    const to = params.dateTo ? new Date(params.dateTo) : new Date();
    return { from, to };
  }

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { from, to };
}

export async function getSummary(params: DateRangeParams): Promise<DashboardSummaryDto> {
  const { from, to } = resolveRange(params);

  const [billRows, reportCounts, registrationCounts, topReferrals, paymentBreakdown, topTests] =
    await Promise.all([
      dashboardRepository.listBillRows(from, to),
      dashboardRepository.getReportCounts(from, to),
      dashboardRepository.getRegistrationCounts(from, to),
      dashboardRepository.getTopReferrals(from, to, TOP_LIST_LIMIT),
      dashboardRepository.getPaymentBreakdown(from, to),
      dashboardRepository.getTopTests(from, to, TOP_LIST_LIMIT),
    ]);

  const walking = billRows.filter((row) => !row.isB2B);
  const b2b = billRows.filter((row) => row.isB2B);
  const sum = (rows: typeof billRows, key: keyof (typeof billRows)[number]) =>
    round2(rows.reduce((total, row) => total + (row[key] as number), 0));

  return {
    range: { from: from.toISOString(), to: to.toISOString() },
    billing: {
      total: sum(walking, "netAmount"),
      collection: sum(walking, "amountPaid"),
      due: sum(walking, "dueAmount"),
      discount: sum(walking, "discountAmount"),
    },
    reports: {
      total: reportCounts.total,
      generated: Math.max(reportCounts.total - reportCounts.pending, 0),
      submitted: reportCounts.submitted,
      pending: reportCounts.pending,
    },
    registration: registrationCounts,
    b2b: {
      business: sum(b2b, "netAmount"),
      collection: sum(b2b, "amountPaid"),
      due: sum(b2b, "dueAmount"),
    },
    topReferrals: topReferrals.rows.map((row) => ({
      id: row.referralSourceId,
      name: row.name,
      amount: round2(row.amount),
    })),
    referralBusinessTotal: round2(topReferrals.total),
    paymentBreakdown: {
      cash: round2(paymentBreakdown.cash),
      online: round2(paymentBreakdown.online),
    },
    topTests: topTests.rows.map((row) => ({
      id: row.testId,
      name: topTests.names.get(row.testId) ?? "Unknown test",
      count: row.count,
    })),
  };
}

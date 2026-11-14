import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { buildBaseWhere, findBillsForReport, type BillWithRelations } from "./bill.repository";
import type { FinanceReportFilters } from "../types/financeReport.types";

const EXPORT_ROW_CAP = 10000;

/** Composes the checkbox-driven status filter Finance Reports needs — a
 *  different shape from the single `view` tab `bill.repository.ts#applyViewFilter`
 *  supports for the general Bill List page, so it isn't reused as-is. */
function buildStatusWhere(
  filters: Pick<FinanceReportFilters, "onlyCancelled" | "includeCancelled" | "includeFree">,
): Prisma.BillWhereInput {
  if (filters.onlyCancelled) {
    return { status: "CANCELLED" };
  }

  const or: Prisma.BillWhereInput[] = [{ status: "ACTIVE", netAmount: { gt: 0 } }];
  if (filters.includeFree) {
    or.push({ status: "ACTIVE", netAmount: 0 });
  }
  if (filters.includeCancelled) {
    or.push({ status: "CANCELLED" });
  }
  return { OR: or };
}

function buildWhere(filters: FinanceReportFilters): Prisma.BillWhereInput {
  const baseWhere = buildBaseWhere({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    organizationId: filters.organizationId,
    referralSourceId: filters.referralSourceId,
  });
  const statusWhere = buildStatusWhere(filters);

  return { AND: [baseWhere, statusWhere] };
}

export async function listFinanceBillRows(
  filters: FinanceReportFilters,
): Promise<BillWithRelations[]> {
  const where = buildWhere(filters);
  return findBillsForReport(where, EXPORT_ROW_CAP);
}

/** Sums every Payment tied to a bill in this filtered set (regardless of
 *  when that payment itself happened), so cash+online always reconciles
 *  exactly with the summary's totalCollectionAmount (sum of the same bills'
 *  amountPaid). */
export async function getPaymentBreakdownForBills(
  filters: FinanceReportFilters,
): Promise<{ cash: number; online: number }> {
  const where = buildWhere(filters);
  const grouped = await prisma.payment.groupBy({
    by: ["mode"],
    where: { bill: { is: where } },
    _sum: { amount: true },
  });

  let cash = 0;
  let online = 0;
  for (const g of grouped) {
    const amount = Number(g._sum.amount ?? 0);
    if (g.mode === "CASH") cash += amount;
    else online += amount;
  }
  return { cash, online };
}

export async function resolveOrganizationNames(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await prisma.organization.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  return new Map(rows.map((r) => [r.id, r.name]));
}

export async function resolveReferralSourceNames(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await prisma.referralSource.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  return new Map(rows.map((r) => [r.id, r.name]));
}

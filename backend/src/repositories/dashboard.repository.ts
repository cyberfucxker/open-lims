import { prisma } from "../config/database";

export interface BillRow {
  netAmount: number;
  amountPaid: number;
  dueAmount: number;
  discountAmount: number;
  isB2B: boolean;
}

/** Active bills in range, reduced in application code (same convention as
 *  referralReport.repository.ts#listIncentiveRows) since the walking-vs-B2B
 *  split and the discount figure (only stored on the related Appointment)
 *  can't both be expressed in a single Prisma aggregate. */
export async function listBillRows(dateFrom: Date, dateTo: Date): Promise<BillRow[]> {
  const rows = await prisma.bill.findMany({
    where: { status: "ACTIVE", createdAt: { gte: dateFrom, lte: dateTo } },
    select: {
      netAmount: true,
      amountPaid: true,
      dueAmount: true,
      appointment: {
        select: {
          discountAmount: true,
          patient: { select: { organizationId: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    netAmount: Number(row.netAmount),
    amountPaid: Number(row.amountPaid),
    dueAmount: Number(row.dueAmount),
    discountAmount: Number(row.appointment.discountAmount),
    isB2B: row.appointment.patient.organizationId !== null,
  }));
}

export async function getReportCounts(
  dateFrom: Date,
  dateTo: Date,
): Promise<{ total: number; pending: number; submitted: number }> {
  const [total, pending, submitted] = await Promise.all([
    prisma.report.count({ where: { createdAt: { gte: dateFrom, lte: dateTo } } }),
    prisma.report.count({
      where: { createdAt: { gte: dateFrom, lte: dateTo }, status: "PENDING" },
    }),
    prisma.report.count({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
        OR: [{ status: { in: ["SUBMITTED", "PRINTED"] } }, { submittedAt: { not: null } }],
      },
    }),
  ]);

  return { total, pending, submitted };
}

export async function getRegistrationCounts(
  dateFrom: Date,
  dateTo: Date,
): Promise<{ total: number; paid: number; pending: number; discounted: number }> {
  const [total, paid, pending, discounted] = await Promise.all([
    prisma.appointment.count({ where: { appointmentDate: { gte: dateFrom, lte: dateTo } } }),
    prisma.appointment.count({
      where: { appointmentDate: { gte: dateFrom, lte: dateTo }, paymentStatus: "PAID" },
    }),
    prisma.appointment.count({
      where: {
        appointmentDate: { gte: dateFrom, lte: dateTo },
        paymentStatus: { in: ["PARTIAL", "PENDING"] },
      },
    }),
    prisma.appointment.count({
      where: {
        appointmentDate: { gte: dateFrom, lte: dateTo },
        discountAmount: { gt: 0 },
      },
    }),
  ]);

  return { total, paid, pending, discounted };
}

export interface TopReferralRow {
  referralSourceId: string;
  name: string;
  amount: number;
}

export async function getTopReferrals(
  dateFrom: Date,
  dateTo: Date,
  limit: number,
): Promise<{ rows: TopReferralRow[]; total: number }> {
  const [grouped, totalAgg] = await Promise.all([
    prisma.referralIncentive.groupBy({
      by: ["referralSourceId"],
      where: { createdAt: { gte: dateFrom, lte: dateTo } },
      _sum: { billAmount: true },
      orderBy: { _sum: { billAmount: "desc" } },
      take: limit,
    }),
    prisma.referralIncentive.aggregate({
      where: { createdAt: { gte: dateFrom, lte: dateTo } },
      _sum: { billAmount: true },
    }),
  ]);

  const sources = await prisma.referralSource.findMany({
    where: { id: { in: grouped.map((g) => g.referralSourceId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(sources.map((s) => [s.id, s.name]));

  return {
    rows: grouped.map((g) => ({
      referralSourceId: g.referralSourceId,
      name: nameById.get(g.referralSourceId) ?? "Unknown",
      amount: Number(g._sum.billAmount ?? 0),
    })),
    total: Number(totalAgg._sum.billAmount ?? 0),
  };
}

export async function getPaymentBreakdown(
  dateFrom: Date,
  dateTo: Date,
): Promise<{ cash: number; online: number }> {
  const grouped = await prisma.payment.groupBy({
    by: ["mode"],
    where: { paymentDate: { gte: dateFrom, lte: dateTo } },
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

export interface TopTestRow {
  testId: string;
  count: number;
}

export async function getTopTests(
  dateFrom: Date,
  dateTo: Date,
  limit: number,
): Promise<{ rows: TopTestRow[]; names: Map<string, string> }> {
  const grouped = await prisma.appointmentTest.groupBy({
    by: ["testId"],
    where: { appointment: { appointmentDate: { gte: dateFrom, lte: dateTo } } },
    _count: { testId: true },
    orderBy: { _count: { testId: "desc" } },
    take: limit,
  });

  const tests = await prisma.test.findMany({
    where: { id: { in: grouped.map((g) => g.testId) } },
    select: { id: true, name: true },
  });

  return {
    rows: grouped.map((g) => ({ testId: g.testId, count: g._count.testId })),
    names: new Map(tests.map((t) => [t.id, t.name])),
  };
}

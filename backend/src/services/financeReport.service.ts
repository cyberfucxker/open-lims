import * as financeReportRepository from "../repositories/financeReport.repository";
import { computeAge } from "../repositories/patient.repository";
import type { BillWithRelations } from "../repositories/bill.repository";
import { fromDbGender, fromDbPaymentMode } from "../utils/enumMappers";
import type {
  FinanceReportFilters,
  FinanceReportGroupBy,
  FinanceReportGroupRow,
  FinanceReportResult,
  FinanceReportRow,
  FinanceReportSummary,
} from "../types/financeReport.types";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function toRow(
  bill: BillWithRelations,
  orgNameById: Map<string, string>,
  referralNameById: Map<string, string>,
): FinanceReportRow {
  const { appointment } = bill;
  const { patient } = appointment;
  const lastPayment = bill.payments[0];

  const organization =
    (patient.organizationId ? orgNameById.get(patient.organizationId) : undefined) ||
    patient.organization ||
    null;
  const doctor =
    (patient.referralSourceId ? referralNameById.get(patient.referralSourceId) : undefined) ||
    patient.referral ||
    null;

  return {
    id: bill.id,
    billNo: bill.billNo,
    patientName: `${patient.firstName} ${patient.lastName}`.trim(),
    patientGender: fromDbGender(patient.gender as Parameters<typeof fromDbGender>[0]),
    patientAge: `${computeAge(patient.dob)}y`,
    appointmentNo: appointment.appointmentNo,
    registrationDate: appointment.appointmentDate.toISOString(),
    receiptDate: lastPayment ? lastPayment.paymentDate.toISOString() : null,
    grossTotal: round2(Number(appointment.subtotal) + Number(bill.additionalCharges)),
    netAmount: Number(bill.netAmount),
    paidAmount: Number(bill.amountPaid),
    discountAmount: Number(appointment.discountAmount),
    dueAmount: Number(bill.dueAmount),
    paymentMode: lastPayment ? fromDbPaymentMode(lastPayment.mode) : null,
    organization: organization ?? null,
    doctor: doctor ?? null,
    status: bill.status,
  };
}

function toSummary(rows: FinanceReportRow[], payments: { cash: number; online: number }) {
  const summary: FinanceReportSummary = {
    totalNetAmount: round2(rows.reduce((sum, r) => sum + r.netAmount, 0)),
    totalCollectionAmount: round2(rows.reduce((sum, r) => sum + r.paidAmount, 0)),
    totalDiscountAmount: round2(rows.reduce((sum, r) => sum + r.discountAmount, 0)),
    totalDueAmount: round2(rows.reduce((sum, r) => sum + r.dueAmount, 0)),
    cash: round2(payments.cash),
    online: round2(payments.online),
  };
  return summary;
}

function groupRows(
  rows: FinanceReportRow[],
  bills: BillWithRelations[],
  groupBy: "organisation" | "referral",
): FinanceReportGroupRow[] {
  const groups = new Map<string, FinanceReportGroupRow>();

  rows.forEach((row, index) => {
    const bill = bills[index];
    const key =
      groupBy === "organisation"
        ? (bill.appointment.patient.organizationId ?? row.organization ?? "walking")
        : (bill.appointment.patient.referralSourceId ?? row.doctor ?? "direct");
    const name =
      groupBy === "organisation"
        ? (row.organization ?? "Walking / Individual")
        : (row.doctor ?? "Direct / No Referral");

    const entry = groups.get(key) ?? {
      id: key,
      name,
      billCount: 0,
      netAmount: 0,
      collectionAmount: 0,
      discountAmount: 0,
      dueAmount: 0,
    };
    entry.billCount += 1;
    entry.netAmount += row.netAmount;
    entry.collectionAmount += row.paidAmount;
    entry.discountAmount += row.discountAmount;
    entry.dueAmount += row.dueAmount;
    groups.set(key, entry);
  });

  return Array.from(groups.values())
    .map((g) => ({
      ...g,
      netAmount: round2(g.netAmount),
      collectionAmount: round2(g.collectionAmount),
      discountAmount: round2(g.discountAmount),
      dueAmount: round2(g.dueAmount),
    }))
    .sort((a, b) => b.netAmount - a.netAmount);
}

export async function getReport(
  filters: FinanceReportFilters,
  groupBy: FinanceReportGroupBy,
): Promise<FinanceReportResult> {
  const [bills, payments] = await Promise.all([
    financeReportRepository.listFinanceBillRows(filters),
    financeReportRepository.getPaymentBreakdownForBills(filters),
  ]);

  const orgIds = [
    ...new Set(
      bills.map((b) => b.appointment.patient.organizationId).filter((id): id is string => !!id),
    ),
  ];
  const referralIds = [
    ...new Set(
      bills.map((b) => b.appointment.patient.referralSourceId).filter((id): id is string => !!id),
    ),
  ];

  const [orgNameById, referralNameById] = await Promise.all([
    financeReportRepository.resolveOrganizationNames(orgIds),
    financeReportRepository.resolveReferralSourceNames(referralIds),
  ]);

  const rows = bills.map((bill) => toRow(bill, orgNameById, referralNameById));
  const summary = toSummary(rows, payments);

  if (groupBy === "organisation" || groupBy === "referral") {
    return { summary, rows: [], groups: groupRows(rows, bills, groupBy) };
  }

  return { summary, rows, groups: [] };
}

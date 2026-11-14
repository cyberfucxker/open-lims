import type { Bill, Appointment, Payment, InvoiceSendLog, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { computeAge } from "./patient.repository";
import { fromDbGender, fromDbPaymentMode, toDbPaymentMode } from "../utils/enumMappers";
import { nextBillNo } from "../utils/idGenerator";
import { onBillPaid } from "../services/labWorkflow.service";
import { recordIncentiveForBillIfApplicable } from "../services/referralIncentive.service";
import type {
  BillDetails,
  BillListItem,
  BillViewStatus,
  CreateBillForAppointmentData,
  InvoiceSendLogRecord,
  PaymentRecord,
} from "../types/bill.types";
import type { PaymentMode } from "../types/appointment.types";

const withAppointmentAndPatient = {
  appointment: {
    include: {
      patient: {
        select: {
          id: true,
          patientId: true,
          firstName: true,
          lastName: true,
          mobile: true,
          email: true,
          gender: true,
          dob: true,
          organization: true,
          referral: true,
          organizationId: true,
          // Selected (but unused by toBillListItem) so the Finance Reports
          // module can reuse this same include/query for its "By Referral
          // Wise Billing" grouping instead of running a parallel query.
          referralSourceId: true,
        },
      },
      tests: { include: { test: { select: { shortName: true } } } },
    },
  },
  // Latest payment only — cheap indexed lookup, exposed as optional fields on
  // BillListItem (see toBillListItem) for the Finance Reports "Receipt
  // Date"/"Payment Mode" columns; unused by the existing Bill List UI.
  payments: { orderBy: { paymentDate: "desc" as const }, take: 1 },
} satisfies Prisma.BillInclude;

const withFullDetails = {
  ...withAppointmentAndPatient,
  payments: { orderBy: { paymentDate: "desc" } },
  sendLogs: { orderBy: { sentAt: "desc" } },
} satisfies Prisma.BillInclude;

type BillPatient = {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string | null;
  gender: string;
  dob: Date;
  organization: string | null;
  referral: string | null;
  organizationId: string | null;
  referralSourceId: string | null;
};

type BillAppointmentTest = {
  testId: string;
  testName: string;
  price: Prisma.Decimal;
  test: { shortName: string };
};
type BillAppointment = Appointment & { patient: BillPatient; tests: BillAppointmentTest[] };
export type BillWithRelations = Bill & { appointment: BillAppointment; payments: Payment[] };
type BillWithFullDetails = BillWithRelations & { sendLogs: InvoiceSendLog[] };

export function toPaymentRecord(payment: Payment): PaymentRecord {
  return {
    id: payment.id,
    amount: Number(payment.amount),
    mode: fromDbPaymentMode(payment.mode) as PaymentMode,
    transactionId: payment.transactionId,
    paymentDate: payment.paymentDate.toISOString(),
    createdAt: payment.createdAt.toISOString(),
  };
}

export function toSendLogRecord(log: InvoiceSendLog): InvoiceSendLogRecord {
  return {
    id: log.id,
    channel: log.channel,
    recipient: log.recipient,
    status: log.status,
    errorMessage: log.errorMessage,
    sentAt: log.sentAt.toISOString(),
  };
}

/** Maps a Bill row (with appointment + patient + tests loaded) to the API shape.
 *  `createdBy` (a username, not just the id) is resolved separately by the
 *  service layer — `createdByUserId` has no Prisma relation to `User` (see
 *  schema note), so a batched lookup happens outside the repository. */
export function toBillListItem(bill: BillWithRelations): BillListItem {
  const { appointment } = bill;
  const { patient } = appointment;
  const lastPayment = bill.payments[0];

  return {
    id: bill.id,
    billNo: bill.billNo,
    status: bill.status,
    appointmentId: appointment.id,
    appointmentNo: appointment.appointmentNo,
    isEmergency: appointment.isEmergency,
    patient: {
      id: patient.id,
      patientId: patient.patientId,
      fullName: `${patient.firstName} ${patient.lastName}`.trim(),
      mobile: patient.mobile,
      email: patient.email,
      gender: fromDbGender(patient.gender as Parameters<typeof fromDbGender>[0]),
      age: computeAge(patient.dob),
      organization: patient.organization,
      referral: patient.referral,
      referralSourceId: patient.referralSourceId,
    },
    createdByUserId: bill.createdByUserId,
    tests: appointment.tests.map((t) => ({
      testId: t.testId,
      testCode: t.test.shortName,
      testName: t.testName,
      price: Number(t.price),
    })),
    subtotal: Number(appointment.subtotal),
    discountPercent: Number(appointment.discountPercent),
    discountAmount: Number(appointment.discountAmount),
    additionalCharges: Number(bill.additionalCharges),
    grossTotal: Number(appointment.subtotal) + Number(bill.additionalCharges),
    lastPaymentDate: lastPayment ? lastPayment.paymentDate.toISOString() : null,
    lastPaymentMode: lastPayment ? (fromDbPaymentMode(lastPayment.mode) as PaymentMode) : null,
    netAmount: Number(bill.netAmount),
    amountPaid: Number(bill.amountPaid),
    dueAmount: Number(bill.dueAmount),
    paymentStatus: bill.paymentStatus,
    paymentMode: fromDbPaymentMode(appointment.paymentMode),
    appointmentDate: appointment.appointmentDate.toISOString(),
    createdAt: bill.createdAt.toISOString(),
    updatedAt: bill.updatedAt.toISOString(),
  };
}

export function toBillDetails(bill: BillWithFullDetails): BillDetails {
  return {
    ...toBillListItem(bill),
    payments: bill.payments.map(toPaymentRecord),
    sendLogs: bill.sendLogs.map(toSendLogRecord),
    printCount: bill.printCount,
    lastPrintedAt: bill.lastPrintedAt?.toISOString() ?? null,
  };
}

/** Always called from within the caller's Appointment-creation transaction —
 *  see `patient.service.ts`/`appointment.service.ts` — so every appointment
 *  gets a bill atomically, never as a separate follow-up write. When the
 *  registration already collected an amount, a matching `Payment` row is
 *  seeded in the same transaction — otherwise `addPaymentAndRecompute`'s
 *  "amountPaid = SUM(payments)" would silently drop that initial amount the
 *  next time a payment is recorded. */
export async function createBillForAppointment(
  data: CreateBillForAppointmentData,
  tx: Prisma.TransactionClient,
) {
  const billNo = await nextBillNo(tx);
  const bill = await tx.bill.create({
    data: {
      billNo,
      appointmentId: data.appointmentId,
      netAmount: data.netAmount,
      amountPaid: data.amountPaid,
      dueAmount: data.dueAmount,
      paymentStatus: data.paymentStatus,
      createdByUserId: data.createdByUserId,
    },
  });

  if (data.amountPaid > 0) {
    await tx.payment.create({
      data: {
        billId: bill.id,
        amount: data.amountPaid,
        mode: toDbPaymentMode(data.paymentMode),
        recordedByUserId: data.createdByUserId,
      },
    });
  }

  // Sample Collection / Report Generation trigger: a bill that's fully paid
  // right at registration (e.g. full cash payment up front) mints Samples +
  // a Report for the appointment immediately, same as a later payment doing
  // so below in `addPaymentAndRecompute`.
  if (data.paymentStatus === "PAID") {
    await onBillPaid(data.appointmentId, tx);
  }

  // Referral Management trigger: if this patient carries a
  // referralSourceId, record the revenue/commission for that source now —
  // a no-op for the overwhelming majority of bills that have no referral
  // source set.
  await recordIncentiveForBillIfApplicable(tx, {
    patientId: data.patientId,
    billId: bill.id,
    billAmount: data.netAmount,
  });

  return bill;
}

export function findBillById(id: string) {
  return prisma.bill.findUnique({ where: { id }, include: withFullDetails });
}

export function findBillByAppointmentId(appointmentId: string) {
  return prisma.bill.findUnique({ where: { appointmentId }, include: withFullDetails });
}

export interface ListBillsFilter {
  view?: BillViewStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  isEmergency?: boolean;
  organizationId?: string;
  /** Not used by the general Bill List page — added for Finance Reports'
   *  Referral filter/grouping (see financeReport.repository.ts). */
  referralSourceId?: string;
  skip: number;
  take: number;
  sortBy: string;
  sortDir: "asc" | "desc";
}

const SORTABLE_FIELDS = new Set(["createdAt", "netAmount", "dueAmount", "billNo"]);

/** Exported for reuse by financeReport.repository.ts, which needs the same
 *  search/date/organization/referral filtering but a different status
 *  filter (checkbox composition instead of a single `view` tab) and a
 *  different result shape (grouped summaries, not BillListItem rows). */
export function buildBaseWhere(
  filter: Pick<
    ListBillsFilter,
    "search" | "dateFrom" | "dateTo" | "isEmergency" | "organizationId" | "referralSourceId"
  >,
): Prisma.BillWhereInput {
  const where: Prisma.BillWhereInput = {};
  const patientFilter: Prisma.PatientWhereInput = {};

  if (filter.organizationId) {
    patientFilter.organizationId = filter.organizationId;
  }
  if (filter.referralSourceId) {
    patientFilter.referralSourceId = filter.referralSourceId;
  }
  const appointmentFilter: Prisma.AppointmentWhereInput = {
    ...(Object.keys(patientFilter).length > 0 ? { patient: { is: patientFilter } } : {}),
  };
  if (filter.search) {
    where.OR = [
      { billNo: { contains: filter.search, mode: "insensitive" } },
      { appointment: { is: { appointmentNo: { contains: filter.search, mode: "insensitive" } } } },
      {
        appointment: {
          is: { patient: { patientId: { contains: filter.search, mode: "insensitive" } } },
        },
      },
      {
        appointment: {
          is: { patient: { firstName: { contains: filter.search, mode: "insensitive" } } },
        },
      },
      {
        appointment: {
          is: { patient: { lastName: { contains: filter.search, mode: "insensitive" } } },
        },
      },
      { appointment: { is: { patient: { mobile: { contains: filter.search } } } } },
    ];
  }
  if (filter.dateFrom || filter.dateTo) {
    appointmentFilter.appointmentDate = {
      ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
      ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
    };
  }
  if (filter.isEmergency !== undefined) {
    appointmentFilter.isEmergency = filter.isEmergency;
  }
  if (Object.keys(appointmentFilter).length > 0) {
    where.appointment = { is: appointmentFilter };
  }

  return where;
}

/** "Free"/"Cancelled"/"Due"/"Paid" are derived views over `status`/`netAmount`/
 *  `dueAmount` — never a separately stored state. */
function applyViewFilter(
  where: Prisma.BillWhereInput,
  view: BillViewStatus | undefined,
): Prisma.BillWhereInput {
  switch (view) {
    case "cancelled":
      return { ...where, status: "CANCELLED" };
    case "free":
      return { ...where, status: "ACTIVE", netAmount: 0 };
    case "paid":
      return { ...where, status: "ACTIVE", netAmount: { gt: 0 }, dueAmount: { lte: 0 } };
    case "due":
      return { ...where, status: "ACTIVE", netAmount: { gt: 0 }, dueAmount: { gt: 0 } };
    default:
      return where;
  }
}

/** Raw Bill rows for an arbitrary caller-built `where` — used by
 *  financeReport.repository.ts, which composes its own status filter
 *  (checkbox-driven, not the single `view` tab `applyViewFilter` supports)
 *  on top of `buildBaseWhere` but still wants the same query/include shape
 *  as `listBills` below instead of a parallel `prisma.bill.findMany` call. */
export function findBillsForReport(
  where: Prisma.BillWhereInput,
  take: number,
): Promise<BillWithRelations[]> {
  return prisma.bill.findMany({
    where,
    include: withAppointmentAndPatient,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function listBills(
  filter: ListBillsFilter,
): Promise<{ rows: BillWithRelations[]; total: number }> {
  const baseWhere = buildBaseWhere(filter);
  const where = applyViewFilter(baseWhere, filter.view);
  const orderBy: Prisma.BillOrderByWithRelationInput = SORTABLE_FIELDS.has(filter.sortBy)
    ? { [filter.sortBy]: filter.sortDir }
    : { createdAt: "desc" };

  const [rows, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      include: withAppointmentAndPatient,
      orderBy,
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.bill.count({ where }),
  ]);

  return { rows, total };
}

/** Powers the All/Due/Paid/Free/Cancelled tab badge counts — same filters as
 *  the active list query minus `view` itself, one count per bucket. */
export async function countBillsByView(
  filter: Pick<
    ListBillsFilter,
    "search" | "dateFrom" | "dateTo" | "isEmergency" | "organizationId"
  >,
): Promise<{ all: number; due: number; paid: number; free: number; cancelled: number }> {
  const baseWhere = buildBaseWhere(filter);
  const [all, due, paid, free, cancelled] = await Promise.all([
    prisma.bill.count({ where: baseWhere }),
    prisma.bill.count({ where: applyViewFilter(baseWhere, "due") }),
    prisma.bill.count({ where: applyViewFilter(baseWhere, "paid") }),
    prisma.bill.count({ where: applyViewFilter(baseWhere, "free") }),
    prisma.bill.count({ where: applyViewFilter(baseWhere, "cancelled") }),
  ]);

  return { all, due, paid, free, cancelled };
}

export function updateBillTotals(
  id: string,
  data: {
    additionalCharges: number;
    netAmount: number;
    dueAmount: number;
    paymentStatus: "PAID" | "PARTIAL" | "PENDING";
  },
) {
  return prisma.bill.update({ where: { id }, data, include: withFullDetails });
}

export function cancelBillById(id: string) {
  return prisma.bill.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: withFullDetails,
  });
}

export function markBillPrinted(id: string) {
  return prisma.bill.update({
    where: { id },
    data: { printCount: { increment: 1 }, lastPrintedAt: new Date() },
    include: withFullDetails,
  });
}

export interface CreatePaymentData {
  billId: string;
  amount: number;
  mode: PaymentMode;
  transactionId?: string;
  paymentDate?: string;
  recordedByUserId?: string | null;
}

/** Records the payment and recomputes the bill's amountPaid/dueAmount/
 *  paymentStatus from the full payment history in one transaction, so the two
 *  never drift apart. */
export async function addPaymentAndRecompute(data: CreatePaymentData) {
  return prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        billId: data.billId,
        amount: data.amount,
        mode: toDbPaymentMode(data.mode),
        transactionId: data.transactionId,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
        recordedByUserId: data.recordedByUserId,
      },
    });

    const bill = await tx.bill.findUniqueOrThrow({ where: { id: data.billId } });
    const aggregate = await tx.payment.aggregate({
      where: { billId: data.billId },
      _sum: { amount: true },
    });
    const amountPaid = Number(aggregate._sum.amount ?? 0);
    const netAmount = Number(bill.netAmount);
    const dueAmount = Math.max(Math.round((netAmount - amountPaid) * 100) / 100, 0);
    const paymentStatus =
      amountPaid >= netAmount && netAmount > 0 ? "PAID" : amountPaid > 0 ? "PARTIAL" : "PENDING";

    const updated = await tx.bill.update({
      where: { id: data.billId },
      data: { amountPaid, dueAmount, paymentStatus },
      include: withFullDetails,
    });

    // Sample Collection / Report Generation trigger — see the matching call
    // in `createBillForAppointment` above.
    if (paymentStatus === "PAID") {
      await onBillPaid(updated.appointmentId, tx);
    }

    return updated;
  });
}

export function listPaymentsForBill(billId: string) {
  return prisma.payment.findMany({ where: { billId }, orderBy: { paymentDate: "desc" } });
}

export function createSendLog(data: {
  billId: string;
  channel: "WHATSAPP" | "EMAIL" | "SMS";
  recipient: string;
  status: "SENT" | "FAILED";
  errorMessage?: string;
}) {
  return prisma.invoiceSendLog.create({ data });
}

export function listSendLogsForBill(billId: string) {
  return prisma.invoiceSendLog.findMany({ where: { billId }, orderBy: { sentAt: "desc" } });
}

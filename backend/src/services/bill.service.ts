import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { resolveUserNames } from "../utils/resolveUserNames";
import * as billRepository from "../repositories/bill.repository";
import {
  toBillDetails,
  toBillListItem,
  toPaymentRecord,
  toSendLogRecord,
} from "../repositories/bill.repository";
import { generateInvoicePdf, generateBillListPdf } from "./invoicePdf.service";
import { generateBillListExcel } from "./excelExport.service";
import { notificationProvider } from "./notifications/console.provider";
import { cancelIncentiveForBillIfPending } from "./referralIncentive.service";
import type {
  AddPaymentInput,
  BillDetails,
  BillListItem,
  ListBillsParams,
  ListBillsResult,
  SendInvoiceInput,
} from "../types/bill.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

/** Prisma's "record to update not found" (P2025) becomes the same 404 a
 *  missing GET would return, instead of an unhandled 500. */
async function withNotFoundTranslation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Bill not found");
    }
    throw error;
  }
}

/** `Bill.createdByUserId` has no Prisma relation to `User` (kept as a plain
 *  id, same as `Appointment.createdByUserId`), so the display name is
 *  resolved with one batched lookup instead of a per-row query. */
async function attachCreatedByNames<T extends BillListItem>(rows: T[]): Promise<T[]> {
  const nameById = await resolveUserNames(rows.map((r) => r.createdByUserId));
  if (nameById.size === 0) return rows;

  return rows.map((row) => ({
    ...row,
    createdBy: row.createdByUserId ? (nameById.get(row.createdByUserId) ?? null) : null,
  }));
}

export async function listBills(params: ListBillsParams): Promise<ListBillsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const sharedFilter = {
    search: params.search,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    isEmergency: params.isEmergency,
    organizationId: params.organizationId,
  };

  const [{ rows, total }, counts] = await Promise.all([
    billRepository.listBills({
      ...sharedFilter,
      view: params.view,
      sortBy: params.sortBy ?? "createdAt",
      sortDir: params.sortDir ?? "desc",
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    billRepository.countBillsByView(sharedFilter),
  ]);

  const mapped = await attachCreatedByNames(rows.map(toBillListItem));
  return { rows: mapped, total, counts };
}

/** Fetches every bill matching the filters (no pagination) — used by the
 *  Excel/PDF export endpoints, which export the whole filtered set. */
async function listAllBillsForExport(params: ListBillsParams): Promise<BillListItem[]> {
  const { rows } = await billRepository.listBills({
    view: params.view,
    search: params.search,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    isEmergency: params.isEmergency,
    sortBy: params.sortBy ?? "createdAt",
    sortDir: params.sortDir ?? "desc",
    skip: 0,
    take: 10000,
  });
  return attachCreatedByNames(rows.map(toBillListItem));
}

/** `scopeOrganizationId` is only ever set for a Collection Center portal
 *  caller — same 404-not-403 pattern as patient.service.ts#getPatient. */
export async function getBillDetails(
  id: string,
  scopeOrganizationId?: string,
): Promise<BillDetails> {
  const bill = await billRepository.findBillById(id);
  if (
    !bill ||
    (scopeOrganizationId && bill.appointment.patient.organizationId !== scopeOrganizationId)
  ) {
    throw ApiError.notFound("Bill not found");
  }
  const [withName] = await attachCreatedByNames([toBillDetails(bill)]);
  return withName as BillDetails;
}

function recomputePaymentStatus(
  netAmount: number,
  amountPaid: number,
): "PAID" | "PARTIAL" | "PENDING" {
  if (netAmount > 0 && amountPaid >= netAmount) return "PAID";
  if (amountPaid > 0) return "PARTIAL";
  return "PENDING";
}

export async function updateAdditionalCharges(
  id: string,
  additionalCharges: number,
): Promise<BillDetails> {
  const bill = await billRepository.findBillById(id);
  if (!bill) {
    throw ApiError.notFound("Bill not found");
  }

  const netAmount = Number(bill.appointment.netAmount) + additionalCharges;
  const dueAmount = Math.max(Math.round((netAmount - Number(bill.amountPaid)) * 100) / 100, 0);
  const paymentStatus = recomputePaymentStatus(netAmount, Number(bill.amountPaid));

  const updated = await withNotFoundTranslation(() =>
    billRepository.updateBillTotals(id, { additionalCharges, netAmount, dueAmount, paymentStatus }),
  );
  const [withName] = await attachCreatedByNames([toBillDetails(updated)]);
  return withName as BillDetails;
}

export async function cancelBill(id: string): Promise<BillDetails> {
  const updated = await withNotFoundTranslation(() => billRepository.cancelBillById(id));
  // Referral Management: a cancelled bill's revenue should never be swept
  // into a future settlement — no-op if this bill never produced an
  // incentive, or if it's already been settled (left untouched).
  await cancelIncentiveForBillIfPending(id);
  const [withName] = await attachCreatedByNames([toBillDetails(updated)]);
  return withName as BillDetails;
}

export async function markBillPrinted(id: string): Promise<BillDetails> {
  const updated = await withNotFoundTranslation(() => billRepository.markBillPrinted(id));
  const [withName] = await attachCreatedByNames([toBillDetails(updated)]);
  return withName as BillDetails;
}

export async function addPayment(
  id: string,
  input: AddPaymentInput,
  recordedByUserId?: string | null,
): Promise<BillDetails> {
  const bill = await billRepository.findBillById(id);
  if (!bill) {
    throw ApiError.notFound("Bill not found");
  }
  if (bill.status === "CANCELLED") {
    throw ApiError.badRequest("Cannot record a payment against a cancelled bill");
  }

  const updated = await billRepository.addPaymentAndRecompute({
    billId: id,
    amount: input.amount,
    mode: input.mode,
    transactionId: input.transactionId,
    paymentDate: input.paymentDate,
    recordedByUserId,
  });
  const [withName] = await attachCreatedByNames([toBillDetails(updated)]);
  return withName as BillDetails;
}

export async function listPayments(id: string) {
  const bill = await billRepository.findBillById(id);
  if (!bill) {
    throw ApiError.notFound("Bill not found");
  }
  const payments = await billRepository.listPaymentsForBill(id);
  return payments.map(toPaymentRecord);
}

export async function generatePdfForBill(
  id: string,
  scopeOrganizationId?: string,
): Promise<{ buffer: Buffer; billNo: string }> {
  const bill = await getBillDetails(id, scopeOrganizationId);
  const buffer = await generateInvoicePdf(bill);
  return { buffer, billNo: bill.billNo };
}

export async function sendInvoice(id: string, input: SendInvoiceInput): Promise<BillDetails> {
  const bill = await getBillDetails(id);
  const recipient = input.recipient || bill.patient.mobile;
  if (!recipient) {
    throw ApiError.badRequest("No recipient available for this channel");
  }

  const message = `Your invoice ${bill.billNo} for ${bill.patient.fullName} — Net Amount Rs. ${bill.netAmount}, Due Rs. ${bill.dueAmount}.`;
  const pdfBuffer = await generateInvoicePdf(bill);

  const result =
    input.channel === "EMAIL"
      ? await notificationProvider.sendEmail(
          recipient,
          `Invoice ${bill.billNo}`,
          message,
          pdfBuffer,
        )
      : input.channel === "SMS"
        ? await notificationProvider.sendSms(recipient, message)
        : await notificationProvider.sendWhatsApp(recipient, message, pdfBuffer);

  await billRepository.createSendLog({
    billId: id,
    channel: input.channel,
    recipient,
    status: result.success ? "SENT" : "FAILED",
    errorMessage: result.error,
  });

  return getBillDetails(id);
}

export async function listSendHistory(id: string) {
  const bill = await billRepository.findBillById(id);
  if (!bill) {
    throw ApiError.notFound("Bill not found");
  }
  const logs = await billRepository.listSendLogsForBill(id);
  return logs.map(toSendLogRecord);
}

export async function exportBillsExcel(params: ListBillsParams): Promise<Buffer> {
  const bills = await listAllBillsForExport(params);
  return generateBillListExcel(bills);
}

export async function exportBillsPdf(params: ListBillsParams): Promise<Buffer> {
  const bills = await listAllBillsForExport(params);
  return generateBillListPdf(bills);
}

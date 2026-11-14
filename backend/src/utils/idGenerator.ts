import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "./ApiError";

type Executor = Pick<typeof prisma, "$queryRaw">;

/**
 * Reads the next value from a Postgres sequence (created in the
 * `add_patient_appointment_module` migration). `nextval()` is atomic at the
 * database level, so concurrent registrations can never be handed the same
 * number — unlike a `count(*) + 1` approach, which races.
 */
async function nextval(sequenceName: string, executor: Executor = prisma): Promise<bigint> {
  const rows = await executor.$queryRaw<{ nextval: bigint }[]>(
    Prisma.sql`SELECT nextval(${Prisma.raw(`'${sequenceName}'`)}) as nextval`,
  );
  return rows[0].nextval;
}

/** Formats to match the existing frontend mock's `LAB######` style. */
export async function nextPatientId(executor?: Executor): Promise<string> {
  const value = await nextval("patient_id_seq", executor);
  return `LAB${value.toString().padStart(6, "0")}`;
}

export async function nextAppointmentNo(executor?: Executor): Promise<string> {
  const value = await nextval("appointment_no_seq", executor);
  return `APT${value.toString().padStart(6, "0")}`;
}

export async function nextBillNo(executor?: Executor): Promise<string> {
  const value = await nextval("bill_no_seq", executor);
  return `INV${value.toString().padStart(6, "0")}`;
}

/** Samples share one global sequence across every Sample Type — the prefix
 *  (from `SampleTypeBarcodeConfig`) is what makes different sample types read
 *  differently, while the shared sequence keeps every sample number globally
 *  unique. Always called from within the caller's transaction so the config
 *  lookup and the mint happen against the same view of the data. */
export async function nextSampleNo(
  sampleTypeId: string,
  tx: Prisma.TransactionClient,
): Promise<string> {
  const config = await tx.sampleTypeBarcodeConfig.findUnique({ where: { sampleTypeId } });
  if (!config) {
    throw ApiError.badRequest(
      "Configure a barcode prefix for this sample type before collecting samples (Barcode Settings).",
    );
  }

  const value = await nextval("sample_no_seq", tx);
  return `${config.prefix}${value.toString().padStart(config.numberLength, "0")}`;
}

export async function nextReportNo(executor?: Executor): Promise<string> {
  const value = await nextval("report_no_seq", executor);
  return `RPT${value.toString().padStart(6, "0")}`;
}

export async function nextOrganizationCode(executor?: Executor): Promise<string> {
  const value = await nextval("organization_code_seq", executor);
  return `ORG${value.toString().padStart(6, "0")}`;
}

export async function nextReferralSourceCode(executor?: Executor): Promise<string> {
  const value = await nextval("referral_source_code_seq", executor);
  return `REF${value.toString().padStart(6, "0")}`;
}

/** Patient App order number, e.g. "ORD000123" — see
 *  `add_app_order_and_ticket_sequences` migration. */
export async function nextAppOrderNumber(executor?: Executor): Promise<string> {
  const value = await nextval("app_order_no_seq", executor);
  return `ORD${value.toString().padStart(6, "0")}`;
}

/** Patient App support ticket number, e.g. "TCK000123". */
export async function nextTicketNumber(executor?: Executor): Promise<string> {
  const value = await nextval("app_ticket_no_seq", executor);
  return `TCK${value.toString().padStart(6, "0")}`;
}

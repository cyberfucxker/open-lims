import type { Prisma } from "@prisma/client";
import * as sampleRepository from "../repositories/sample.repository";
import * as reportRepository from "../repositories/report.repository";

/**
 * The one integration point between the (untouched) Billing module and the
 * new Sample Collection / Report Generation modules: called the moment a
 * Bill's `paymentStatus` becomes PAID (see `bill.repository.ts`), inside the
 * same transaction, so a fully-paid appointment always gets its Samples +
 * Report minted atomically alongside the payment that triggered it.
 *
 * Both `ensure*` calls are idempotent (no-op if already created), so this
 * is safe to call from multiple payment paths without risk of double-minting.
 */
export async function onBillPaid(
  appointmentId: string,
  tx: Prisma.TransactionClient,
): Promise<void> {
  await sampleRepository.ensureSamplesForAppointment(appointmentId, tx);
  await reportRepository.ensureReportForAppointment(appointmentId, tx);
}

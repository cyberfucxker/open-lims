import type { Prisma } from "@prisma/client";
import * as referralIncentiveRepository from "../repositories/referralIncentive.repository";
import { toReferralIncentiveDto } from "../repositories/referralIncentive.repository";
import type {
  ListReferralIncentivesParams,
  ListReferralIncentivesResult,
  MonthlyIncentiveSummaryDto,
  ReferralIncentiveDto,
} from "../types/referralIncentive.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Called from bill.repository.ts#createBillForAppointment, inside the same
 *  transaction as the Bill write. No-op if the patient has no
 *  referralSourceId — most bills never touch this module at all. */
export async function recordIncentiveForBillIfApplicable(
  tx: Prisma.TransactionClient,
  input: { patientId: string; billId: string; billAmount: number },
): Promise<void> {
  const patient = await tx.patient.findUnique({
    where: { id: input.patientId },
    select: { referralSourceId: true },
  });

  if (!patient?.referralSourceId) {
    return;
  }

  const source = await tx.referralSource.findUnique({
    where: { id: patient.referralSourceId },
    select: { commissionPercentage: true },
  });
  if (!source) {
    return;
  }

  const commissionPercentage = Number(source.commissionPercentage);
  const incentiveAmount = round2(input.billAmount * (commissionPercentage / 100));

  await referralIncentiveRepository.createReferralIncentive(
    {
      referralSourceId: patient.referralSourceId,
      billId: input.billId,
      patientId: input.patientId,
      billAmount: input.billAmount,
      commissionPercentage,
      incentiveAmount,
    },
    tx,
  );
}

/** Called from bill.service.ts#cancelBill — if the cancelled bill produced a
 *  still-PENDING incentive (not yet swept into a settlement), cancel it too
 *  so it never gets counted in a future settlement. Already-SETTLED
 *  incentives are left untouched (reconciling a cancelled bill inside an
 *  already-paid settlement is a manual/operational concern). */
export async function cancelIncentiveForBillIfPending(billId: string): Promise<void> {
  const incentive = await referralIncentiveRepository.findByBillId(billId);
  if (incentive && incentive.incentiveStatus === "PENDING") {
    await referralIncentiveRepository.setIncentiveStatusByBillId(billId, "CANCELLED");
  }
}

export async function listIncentives(
  params: ListReferralIncentivesParams,
): Promise<ListReferralIncentivesResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await referralIncentiveRepository.listReferralIncentives({
    referralSourceId: params.referralSourceId,
    incentiveStatus: params.incentiveStatus,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toReferralIncentiveDto), total };
}

export async function listByReferralSource(
  referralSourceId: string,
): Promise<ReferralIncentiveDto[]> {
  const { rows } = await referralIncentiveRepository.listReferralIncentives({
    referralSourceId,
    skip: 0,
    take: 500,
  });
  return rows.map(toReferralIncentiveDto);
}

export async function getMonthlyIncentiveSummary(
  month: number,
  year: number,
): Promise<MonthlyIncentiveSummaryDto[]> {
  return referralIncentiveRepository.getMonthlyIncentiveSummary(month, year);
}

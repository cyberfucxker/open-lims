import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import * as referralSettlementRepository from "../repositories/referralSettlement.repository";
import { toReferralSettlementDto } from "../repositories/referralSettlement.repository";
import * as referralIncentiveRepository from "../repositories/referralIncentive.repository";
import { getReferralSource } from "./referralSource.service";
import type {
  GenerateSettlementInput,
  ListReferralSettlementsParams,
  ListReferralSettlementsResult,
  ReferralSettlementDetailsDto,
  ReferralSettlementDto,
} from "../types/referralSettlement.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function listSettlements(
  params: ListReferralSettlementsParams,
): Promise<ListReferralSettlementsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await referralSettlementRepository.listReferralSettlements({
    referralSourceId: params.referralSourceId,
    settlementStatus: params.settlementStatus,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toReferralSettlementDto), total };
}

export async function listAllForExport(
  params: Pick<
    ListReferralSettlementsParams,
    "referralSourceId" | "settlementStatus" | "dateFrom" | "dateTo" | "search"
  >,
): Promise<ReferralSettlementDto[]> {
  const rows = await referralSettlementRepository.listAllForExport(params);
  return rows.map(toReferralSettlementDto);
}

export async function getSettlement(id: string): Promise<ReferralSettlementDetailsDto> {
  const settlement = await referralSettlementRepository.findById(id);
  if (!settlement) {
    throw ApiError.notFound("Referral settlement not found");
  }
  const incentives = await referralSettlementRepository.findIncentiveLines(id);
  return { ...toReferralSettlementDto(settlement), incentives };
}

export async function generateSettlement(
  input: GenerateSettlementInput,
): Promise<ReferralSettlementDto> {
  const source = await getReferralSource(input.referralSourceId);

  const fromDate = new Date(input.fromDate);
  const toDate = new Date(input.toDate);
  const toDateExclusive = new Date(toDate);
  toDateExclusive.setDate(toDateExclusive.getDate() + 1);

  if (fromDate > toDate) {
    throw ApiError.badRequest("'From Date' must be on or before 'To Date'");
  }

  const settlement = await prisma.$transaction(async (tx) => {
    const pendingIncentives = await referralIncentiveRepository.listPendingIncentivesForSettlement(
      input.referralSourceId,
      fromDate,
      toDateExclusive,
      tx,
    );

    if (pendingIncentives.length === 0) {
      throw ApiError.badRequest(
        "No unsettled patient revenue found for this referral source in the selected date range",
      );
    }

    const totalRevenue = round2(
      pendingIncentives.reduce((sum, incentive) => sum + Number(incentive.billAmount), 0),
    );
    const commissionAmount = round2(
      pendingIncentives.reduce((sum, incentive) => sum + Number(incentive.incentiveAmount), 0),
    );
    const totalPatients = new Set(pendingIncentives.map((incentive) => incentive.patientId)).size;
    const adjustment = input.adjustment ?? 0;
    const finalAmount = round2(commissionAmount + adjustment);

    const created = await referralSettlementRepository.createSettlement(
      {
        referralSourceId: input.referralSourceId,
        fromDate,
        toDate,
        totalPatients,
        totalRevenue,
        commissionPercentage: source.commissionPercentage,
        commissionAmount,
        adjustment,
        finalAmount,
        remarks: input.remarks,
      },
      tx,
    );

    await referralIncentiveRepository.markIncentivesSettled(
      pendingIncentives.map((incentive) => incentive.id),
      created.id,
      tx,
    );

    return created;
  });

  return toReferralSettlementDto(settlement);
}

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Referral settlement not found");
    }
    throw error;
  }
}

export async function markPaid(id: string): Promise<ReferralSettlementDto> {
  const settlement = await referralSettlementRepository.findById(id);
  if (!settlement) {
    throw ApiError.notFound("Referral settlement not found");
  }
  if (settlement.settlementStatus !== "PENDING") {
    throw ApiError.badRequest("Only a pending settlement can be marked paid");
  }

  const updated = await withTranslatedErrors(() => referralSettlementRepository.markPaid(id));
  return toReferralSettlementDto(updated);
}

export async function cancelSettlement(id: string): Promise<ReferralSettlementDto> {
  const settlement = await referralSettlementRepository.findById(id);
  if (!settlement) {
    throw ApiError.notFound("Referral settlement not found");
  }
  if (settlement.settlementStatus === "CANCELLED") {
    throw ApiError.badRequest("This settlement is already cancelled");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await referralIncentiveRepository.revertIncentivesForSettlement(id, tx);
    return referralSettlementRepository.cancel(id, tx);
  });

  return toReferralSettlementDto(updated);
}

import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as commissionSlabRepository from "../repositories/commissionSlab.repository";
import {
  toCommissionSlabDto,
  type CommissionSlabWriteInput,
} from "../repositories/commissionSlab.repository";
import type {
  CommissionResult,
  CommissionSlabDto,
  ListCommissionSlabsResult,
} from "../types/commissionSlab.types";

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Commission slab not found");
    }
    throw error;
  }
}

export async function listCommissionSlabs(): Promise<ListCommissionSlabsResult> {
  const rows = await commissionSlabRepository.listCommissionSlabs();
  return { rows: rows.map(toCommissionSlabDto) };
}

export async function createCommissionSlab(
  values: CommissionSlabWriteInput,
): Promise<CommissionSlabDto> {
  if (values.toAmount != null && values.toAmount <= values.fromAmount) {
    throw ApiError.badRequest("'To Amount' must be greater than 'From Amount'");
  }
  const slab = await commissionSlabRepository.createCommissionSlab(values);
  return toCommissionSlabDto(slab);
}

export async function updateCommissionSlab(
  id: string,
  values: CommissionSlabWriteInput,
): Promise<CommissionSlabDto> {
  if (values.toAmount != null && values.toAmount <= values.fromAmount) {
    throw ApiError.badRequest("'To Amount' must be greater than 'From Amount'");
  }
  const slab = await withTranslatedErrors(() =>
    commissionSlabRepository.updateCommissionSlab(id, values),
  );
  return toCommissionSlabDto(slab);
}

export async function deleteCommissionSlab(id: string): Promise<void> {
  await withTranslatedErrors(() => commissionSlabRepository.deleteCommissionSlab(id));
}

export async function setCommissionSlabStatus(
  id: string,
  active: boolean,
): Promise<CommissionSlabDto> {
  const slab = await withTranslatedErrors(() =>
    commissionSlabRepository.setCommissionSlabStatus(id, active),
  );
  return toCommissionSlabDto(slab);
}

export async function listActiveCommissionSlabDtos(): Promise<CommissionSlabDto[]> {
  const slabs = await commissionSlabRepository.listActiveCommissionSlabsOrdered();
  return slabs.map(toCommissionSlabDto);
}

/** Picks the single active slab (from a pre-loaded list) whose [fromAmount,
 *  toAmount] band contains `achievedRevenue` and returns the computed
 *  commission amount. No match (e.g. no slabs configured, or revenue below
 *  every band's fromAmount) — returns amount 0 rather than throwing, since a
 *  missing/incomplete commission configuration shouldn't block the Monthly
 *  Report from rendering. Takes the slab list as a parameter so a caller
 *  computing commission for many staff in a loop (Monthly Report) can load
 *  the slabs once instead of once per staff member. */
export function calculateCommissionFromSlabs(
  achievedRevenue: number,
  slabs: CommissionSlabDto[],
): CommissionResult {
  const matched = slabs.find(
    (slab) =>
      achievedRevenue >= slab.fromAmount &&
      (slab.toAmount === null || achievedRevenue <= slab.toAmount),
  );

  if (!matched) {
    return { slab: null, amount: 0 };
  }

  return {
    slab: matched,
    amount: Math.round(achievedRevenue * (matched.percentage / 100) * 100) / 100,
  };
}

/** Convenience single-shot version — loads active slabs and computes
 *  commission for one revenue figure. Used outside report loops. */
export async function calculateCommission(achievedRevenue: number): Promise<CommissionResult> {
  const slabs = await listActiveCommissionSlabDtos();
  return calculateCommissionFromSlabs(achievedRevenue, slabs);
}

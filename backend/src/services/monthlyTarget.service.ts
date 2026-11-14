import { ApiError } from "../utils/ApiError";
import * as monthlyTargetRepository from "../repositories/monthlyTarget.repository";
import { toMonthlyTargetDto } from "../repositories/monthlyTarget.repository";
import { assertMarketingStaffExists } from "./marketingStaff.service";
import type {
  ListMonthlyTargetsParams,
  ListMonthlyTargetsResult,
  MonthlyTargetDto,
  UpsertMonthlyTargetInput,
} from "../types/monthlyTarget.types";

export async function upsertTarget(values: UpsertMonthlyTargetInput): Promise<MonthlyTargetDto> {
  await assertMarketingStaffExists(values.marketingStaffId);

  const target = await monthlyTargetRepository.upsertMonthlyTarget(values);
  return toMonthlyTargetDto(target);
}

export async function getTarget(
  marketingStaffId: string,
  month: number,
  year: number,
): Promise<MonthlyTargetDto> {
  const target = await monthlyTargetRepository.findMonthlyTarget(marketingStaffId, month, year);
  if (!target) {
    throw ApiError.notFound("No target set for this staff member in the given month");
  }
  return toMonthlyTargetDto(target);
}

export async function listTargets(
  params: ListMonthlyTargetsParams,
): Promise<ListMonthlyTargetsResult> {
  if (params.marketingStaffId) {
    const rows = await monthlyTargetRepository.listMonthlyTargetsByStaff(params.marketingStaffId);
    return { rows: rows.map(toMonthlyTargetDto) };
  }

  const month = params.month ?? new Date().getMonth() + 1;
  const year = params.year ?? new Date().getFullYear();
  const rows = await monthlyTargetRepository.listMonthlyTargetsForMonth(month, year);
  return { rows: rows.map(toMonthlyTargetDto) };
}

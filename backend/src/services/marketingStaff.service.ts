import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as marketingStaffRepository from "../repositories/marketingStaff.repository";
import {
  toMarketingStaffDto,
  type MarketingStaffWriteInput,
} from "../repositories/marketingStaff.repository";
import type {
  ListMarketingStaffParams,
  ListMarketingStaffResult,
  MarketingStaffAuditLogDto,
  MarketingStaffDto,
} from "../types/marketingStaff.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Marketing staff not found");
      }
      if (error.code === "P2002") {
        throw ApiError.conflict("A marketing staff member with this employee code already exists");
      }
    }
    throw error;
  }
}

export async function listMarketingStaff(
  params: ListMarketingStaffParams,
): Promise<ListMarketingStaffResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await marketingStaffRepository.listMarketingStaff({
    search: params.search,
    active: params.active,
    includeDeleted: params.includeDeleted === "true",
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toMarketingStaffDto), total };
}

export async function listActiveMarketingStaff(): Promise<MarketingStaffDto[]> {
  const rows = await marketingStaffRepository.listActiveMarketingStaff();
  return rows.map(toMarketingStaffDto);
}

export async function getMarketingStaff(id: string): Promise<MarketingStaffDto> {
  const staff = await marketingStaffRepository.findMarketingStaffById(id);
  if (!staff) {
    throw ApiError.notFound("Marketing staff not found");
  }
  return toMarketingStaffDto(staff);
}

export async function createMarketingStaff(
  values: MarketingStaffWriteInput,
  performedByUserId?: string | null,
): Promise<MarketingStaffDto> {
  const staff = await withTranslatedErrors(() =>
    marketingStaffRepository.createMarketingStaff(values),
  );
  await marketingStaffRepository.createAuditLog(staff.id, "CREATED", performedByUserId);
  return toMarketingStaffDto(staff);
}

export async function updateMarketingStaff(
  id: string,
  values: MarketingStaffWriteInput,
  performedByUserId?: string | null,
): Promise<MarketingStaffDto> {
  const staff = await withTranslatedErrors(() =>
    marketingStaffRepository.updateMarketingStaff(id, values),
  );
  await marketingStaffRepository.createAuditLog(id, "UPDATED", performedByUserId);
  return toMarketingStaffDto(staff);
}

export async function deleteMarketingStaff(
  id: string,
  performedByUserId?: string | null,
): Promise<void> {
  await withTranslatedErrors(() => marketingStaffRepository.softDeleteMarketingStaff(id));
  await marketingStaffRepository.createAuditLog(id, "DELETED", performedByUserId);
}

export async function restoreMarketingStaff(
  id: string,
  performedByUserId?: string | null,
): Promise<MarketingStaffDto> {
  const staff = await withTranslatedErrors(() =>
    marketingStaffRepository.restoreMarketingStaff(id),
  );
  await marketingStaffRepository.createAuditLog(id, "RESTORED", performedByUserId);
  return toMarketingStaffDto(staff);
}

export async function setMarketingStaffStatus(
  id: string,
  status: boolean,
  performedByUserId?: string | null,
): Promise<MarketingStaffDto> {
  const staff = await withTranslatedErrors(() =>
    marketingStaffRepository.setMarketingStaffStatus(id, status),
  );
  await marketingStaffRepository.createAuditLog(
    id,
    "STATUS_CHANGED",
    performedByUserId,
    status ? "Activated" : "Deactivated",
  );
  return toMarketingStaffDto(staff);
}

export async function listAuditLogs(id: string): Promise<MarketingStaffAuditLogDto[]> {
  await getMarketingStaff(id);
  const logs = await marketingStaffRepository.listAuditLogs(id);
  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    performedByUserId: log.performedByUserId,
    note: log.note,
    createdAt: log.createdAt.toISOString(),
  }));
}

/** Throws if the given staff id doesn't resolve to a non-deleted record —
 *  used by ReferralDoctor's assign/transfer/bulk-assign to validate the
 *  target before mutating. */
export async function assertMarketingStaffExists(id: string): Promise<void> {
  const staff = await marketingStaffRepository.findMarketingStaffById(id);
  if (!staff) {
    throw ApiError.badRequest("Selected marketing staff does not exist");
  }
}

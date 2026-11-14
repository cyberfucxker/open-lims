import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { nextReferralSourceCode } from "../utils/idGenerator";
import * as referralSourceRepository from "../repositories/referralSource.repository";
import {
  toReferralSourceDto,
  type ReferralSourceWriteInput,
} from "../repositories/referralSource.repository";
import { assertMarketingStaffExists } from "./marketingStaff.service";
import * as priceListService from "./priceList.service";
import * as organizationRepository from "../repositories/organization.repository";
import type {
  ListReferralSourcesParams,
  ListReferralSourcesResult,
  ReferralPriceAssignmentView,
  ReferralSourceAuditLogDto,
  ReferralSourceDto,
} from "../types/referralSource.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Referral source not found");
      }
      if (error.code === "P2002") {
        throw ApiError.conflict("A referral source with this code already exists");
      }
    }
    throw error;
  }
}

async function assertReferencesExist(values: ReferralSourceWriteInput): Promise<void> {
  if (values.marketingStaffId) {
    await assertMarketingStaffExists(values.marketingStaffId);
  }
  if (values.organizationId) {
    const organization = await organizationRepository.findOrganizationById(values.organizationId);
    if (!organization) {
      throw ApiError.badRequest("Selected organization does not exist");
    }
  }
}

export async function listReferralSources(
  params: ListReferralSourcesParams,
): Promise<ListReferralSourcesResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await referralSourceRepository.listReferralSources({
    search: params.search,
    active: params.active,
    includeDeleted: params.includeDeleted === "true",
    referralType: params.referralType,
    marketingStaffId: params.marketingStaffId,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toReferralSourceDto), total };
}

export async function listActiveReferralSources(): Promise<ReferralSourceDto[]> {
  const rows = await referralSourceRepository.listActiveReferralSources();
  return rows.map(toReferralSourceDto);
}

export async function listAllReferralSources(): Promise<ReferralSourceDto[]> {
  const rows = await referralSourceRepository.listAllReferralSources();
  return rows.map(toReferralSourceDto);
}

export async function getReferralSource(id: string): Promise<ReferralSourceDto> {
  const source = await referralSourceRepository.findReferralSourceById(id);
  if (!source) {
    throw ApiError.notFound("Referral source not found");
  }
  return toReferralSourceDto(source);
}

export async function createReferralSource(
  values: ReferralSourceWriteInput,
  performedByUserId?: string | null,
): Promise<ReferralSourceDto> {
  await assertReferencesExist(values);

  const referralCode = await nextReferralSourceCode();
  const source = await withTranslatedErrors(() =>
    referralSourceRepository.createReferralSource({ ...values, referralCode }),
  );
  await referralSourceRepository.createAuditLog(source.id, "CREATED", performedByUserId);
  return toReferralSourceDto(source);
}

export async function updateReferralSource(
  id: string,
  values: ReferralSourceWriteInput,
  performedByUserId?: string | null,
): Promise<ReferralSourceDto> {
  await assertReferencesExist(values);

  const source = await withTranslatedErrors(() =>
    referralSourceRepository.updateReferralSource(id, values),
  );
  await referralSourceRepository.createAuditLog(id, "UPDATED", performedByUserId);
  return toReferralSourceDto(source);
}

export async function deleteReferralSource(
  id: string,
  performedByUserId?: string | null,
): Promise<void> {
  await withTranslatedErrors(() => referralSourceRepository.softDeleteReferralSource(id));
  await referralSourceRepository.createAuditLog(id, "DELETED", performedByUserId);
}

export async function restoreReferralSource(
  id: string,
  performedByUserId?: string | null,
): Promise<ReferralSourceDto> {
  const source = await withTranslatedErrors(() =>
    referralSourceRepository.restoreReferralSource(id),
  );
  await referralSourceRepository.createAuditLog(id, "RESTORED", performedByUserId);
  return toReferralSourceDto(source);
}

export async function setReferralSourceStatus(
  id: string,
  status: boolean,
  performedByUserId?: string | null,
): Promise<ReferralSourceDto> {
  const source = await withTranslatedErrors(() =>
    referralSourceRepository.setReferralSourceStatus(id, status),
  );
  await referralSourceRepository.createAuditLog(
    id,
    "STATUS_CHANGED",
    performedByUserId,
    status ? "Activated" : "Deactivated",
  );
  return toReferralSourceDto(source);
}

export async function assignPriceList(
  id: string,
  priceListId: string,
  performedByUserId?: string | null,
): Promise<ReferralSourceDto> {
  await getReferralSource(id);
  const priceList = await priceListService.getPriceList(priceListId);

  const source = await withTranslatedErrors(() =>
    referralSourceRepository.assignPriceList(id, priceListId),
  );
  await referralSourceRepository.createPriceAssignmentHistory(id, priceListId, performedByUserId);
  await referralSourceRepository.createAuditLog(
    id,
    "PRICE_LIST_ASSIGNED",
    performedByUserId,
    `Assigned "${priceList.name}"`,
  );
  return toReferralSourceDto(source);
}

export async function removePriceList(
  id: string,
  performedByUserId?: string | null,
): Promise<ReferralSourceDto> {
  await getReferralSource(id);

  const source = await withTranslatedErrors(() => referralSourceRepository.removePriceList(id));
  await referralSourceRepository.createAuditLog(id, "PRICE_LIST_REMOVED", performedByUserId);
  return toReferralSourceDto(source);
}

export async function getPriceListAssignment(id: string): Promise<ReferralPriceAssignmentView> {
  const source = await getReferralSource(id);
  const history = await referralSourceRepository.listPriceAssignmentHistory(id);

  return {
    assignedPriceListId: source.assignedPriceListId,
    assignedPriceListName: source.assignedPriceListName,
    history: history.map((row) => ({
      id: row.id,
      priceListId: row.priceListId,
      priceListName: row.priceList.name,
      assignedBy: row.assignedBy,
      assignedAt: row.assignedAt.toISOString(),
    })),
  };
}

export async function listAuditLogs(id: string): Promise<ReferralSourceAuditLogDto[]> {
  await getReferralSource(id);
  const logs = await referralSourceRepository.listAuditLogs(id);
  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    performedByUserId: log.performedByUserId,
    note: log.note,
    createdAt: log.createdAt.toISOString(),
  }));
}

/** Throws if the given source id doesn't resolve to a non-deleted record —
 *  used by the incentive/settlement/report services to validate a
 *  `referralSourceId` before mutating. */
export async function assertReferralSourceExists(id: string): Promise<void> {
  const source = await referralSourceRepository.findReferralSourceById(id);
  if (!source) {
    throw ApiError.badRequest("Selected referral source does not exist");
  }
}

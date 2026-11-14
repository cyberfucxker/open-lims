import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as referralDoctorRepository from "../repositories/referralDoctor.repository";
import {
  toReferralDoctorDto,
  type ReferralDoctorWriteInput,
} from "../repositories/referralDoctor.repository";
import { assertMarketingStaffExists } from "./marketingStaff.service";
import * as marketingStaffRepository from "../repositories/marketingStaff.repository";
import { toMarketingStaffDto } from "../repositories/marketingStaff.repository";
import type {
  ListReferralDoctorsParams,
  ListReferralDoctorsResult,
  ReferralDoctorAuditLogDto,
  ReferralDoctorDto,
} from "../types/referralDoctor.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Referral doctor not found");
      }
    }
    throw error;
  }
}

export async function listReferralDoctors(
  params: ListReferralDoctorsParams,
): Promise<ListReferralDoctorsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await referralDoctorRepository.listReferralDoctors({
    search: params.search,
    active: params.active,
    includeDeleted: params.includeDeleted === "true",
    marketingStaffId: params.marketingStaffId,
    unassignedOnly: params.unassignedOnly === "true",
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toReferralDoctorDto), total };
}

export async function listActiveReferralDoctors(): Promise<ReferralDoctorDto[]> {
  const rows = await referralDoctorRepository.listActiveReferralDoctors();
  return rows.map(toReferralDoctorDto);
}

export async function getReferralDoctor(id: string): Promise<ReferralDoctorDto> {
  const doctor = await referralDoctorRepository.findReferralDoctorById(id);
  if (!doctor) {
    throw ApiError.notFound("Referral doctor not found");
  }
  return toReferralDoctorDto(doctor);
}

async function assertOptionalStaffExists(marketingStaffId?: string | null): Promise<void> {
  if (marketingStaffId) {
    await assertMarketingStaffExists(marketingStaffId);
  }
}

export async function createReferralDoctor(
  values: ReferralDoctorWriteInput,
  performedByUserId?: string | null,
): Promise<ReferralDoctorDto> {
  await assertOptionalStaffExists(values.marketingStaffId);
  const doctor = await withTranslatedErrors(() =>
    referralDoctorRepository.createReferralDoctor(values),
  );
  await referralDoctorRepository.createAuditLog(doctor.id, "CREATED", performedByUserId);
  return toReferralDoctorDto(doctor);
}

export async function updateReferralDoctor(
  id: string,
  values: ReferralDoctorWriteInput,
  performedByUserId?: string | null,
): Promise<ReferralDoctorDto> {
  await assertOptionalStaffExists(values.marketingStaffId);
  const doctor = await withTranslatedErrors(() =>
    referralDoctorRepository.updateReferralDoctor(id, values),
  );
  await referralDoctorRepository.createAuditLog(id, "UPDATED", performedByUserId);
  return toReferralDoctorDto(doctor);
}

export async function deleteReferralDoctor(
  id: string,
  performedByUserId?: string | null,
): Promise<void> {
  await withTranslatedErrors(() => referralDoctorRepository.softDeleteReferralDoctor(id));
  await referralDoctorRepository.createAuditLog(id, "DELETED", performedByUserId);
}

export async function restoreReferralDoctor(
  id: string,
  performedByUserId?: string | null,
): Promise<ReferralDoctorDto> {
  const doctor = await withTranslatedErrors(() =>
    referralDoctorRepository.restoreReferralDoctor(id),
  );
  await referralDoctorRepository.createAuditLog(id, "RESTORED", performedByUserId);
  return toReferralDoctorDto(doctor);
}

export async function setReferralDoctorStatus(
  id: string,
  status: boolean,
  performedByUserId?: string | null,
): Promise<ReferralDoctorDto> {
  const doctor = await withTranslatedErrors(() =>
    referralDoctorRepository.setReferralDoctorStatus(id, status),
  );
  await referralDoctorRepository.createAuditLog(
    id,
    "STATUS_CHANGED",
    performedByUserId,
    status ? "Activated" : "Deactivated",
  );
  return toReferralDoctorDto(doctor);
}

export async function assignDoctor(
  id: string,
  marketingStaffId: string,
  performedByUserId?: string | null,
): Promise<ReferralDoctorDto> {
  const existing = await getReferralDoctor(id);
  await assertMarketingStaffExists(marketingStaffId);

  const doctor = await withTranslatedErrors(() =>
    referralDoctorRepository.assignReferralDoctor(id, marketingStaffId),
  );

  const staff = await marketingStaffRepository.findMarketingStaffById(marketingStaffId);
  const staffName = staff ? toMarketingStaffDto(staff).name : marketingStaffId;
  const action = existing.marketingStaffId ? "TRANSFERRED" : "ASSIGNED";
  const note = existing.marketingStaffId
    ? `From ${existing.marketingStaffName ?? "unassigned"} to ${staffName}`
    : `Assigned to ${staffName}`;

  await referralDoctorRepository.createAuditLog(id, action, performedByUserId, note);
  return toReferralDoctorDto(doctor);
}

export async function transferDoctor(
  id: string,
  marketingStaffId: string,
  performedByUserId?: string | null,
): Promise<ReferralDoctorDto> {
  const existing = await getReferralDoctor(id);
  if (!existing.marketingStaffId) {
    throw ApiError.badRequest("This doctor is not currently assigned to any staff member");
  }
  await assertMarketingStaffExists(marketingStaffId);

  const doctor = await withTranslatedErrors(() =>
    referralDoctorRepository.assignReferralDoctor(id, marketingStaffId),
  );

  const staff = await marketingStaffRepository.findMarketingStaffById(marketingStaffId);
  const staffName = staff ? toMarketingStaffDto(staff).name : marketingStaffId;
  await referralDoctorRepository.createAuditLog(
    id,
    "TRANSFERRED",
    performedByUserId,
    `From ${existing.marketingStaffName ?? "unassigned"} to ${staffName}`,
  );
  return toReferralDoctorDto(doctor);
}

export async function bulkAssignDoctors(
  doctorIds: string[],
  marketingStaffId: string,
  performedByUserId?: string | null,
): Promise<ReferralDoctorDto[]> {
  await assertMarketingStaffExists(marketingStaffId);

  const existingDoctors = await referralDoctorRepository.findReferralDoctorsByIds(doctorIds);
  if (existingDoctors.length === 0) {
    throw ApiError.badRequest("No valid referral doctors were selected");
  }

  const updated = await referralDoctorRepository.bulkAssignReferralDoctors(
    existingDoctors.map((doctor) => doctor.id),
    marketingStaffId,
  );

  await Promise.all(
    existingDoctors.map((doctor) =>
      referralDoctorRepository.createAuditLog(
        doctor.id,
        "BULK_ASSIGNED",
        performedByUserId,
        `Bulk assigned to staff ${marketingStaffId}`,
      ),
    ),
  );

  return updated.map(toReferralDoctorDto);
}

export async function listAuditLogs(id: string): Promise<ReferralDoctorAuditLogDto[]> {
  await getReferralDoctor(id);
  const logs = await referralDoctorRepository.listAuditLogs(id);
  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    performedByUserId: log.performedByUserId,
    note: log.note,
    createdAt: log.createdAt.toISOString(),
  }));
}

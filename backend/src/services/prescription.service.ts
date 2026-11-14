import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as prescriptionRepository from "../repositories/prescription.repository";
import { toPrescriptionDto } from "../repositories/prescription.repository";
import type {
  ListPrescriptionsParams,
  ListPrescriptionsResult,
  PrescriptionDto,
  PrescriptionStatus,
} from "../types/prescription.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Prescription not found");
    }
    throw error;
  }
}

export async function listPrescriptions(
  params: ListPrescriptionsParams,
): Promise<ListPrescriptionsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total, statusCounts } = await prescriptionRepository.listPrescriptions({
    search: params.search,
    status: params.status,
    cityId: params.cityId,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    rows: rows.map(toPrescriptionDto),
    total,
    statusCounts: {
      SUBMITTED: statusCounts.SUBMITTED ?? 0,
      APPROVED: statusCounts.APPROVED ?? 0,
      REJECTED: statusCounts.REJECTED ?? 0,
    },
  };
}

export async function getPrescription(id: string): Promise<PrescriptionDto> {
  const prescription = await prescriptionRepository.findPrescriptionById(id);
  if (!prescription) {
    throw ApiError.notFound("Prescription not found");
  }
  return toPrescriptionDto(prescription);
}

/** A rejection has to say why — the reason is what the patient is told, and
 *  "rejected" on its own leaves them re-uploading the same unreadable photo.
 *  Moving off REJECTED clears the old reason rather than leaving a stale one
 *  attached to an approved row. */
export async function setPrescriptionStatus(
  id: string,
  status: PrescriptionStatus,
  rejectionReason?: string,
): Promise<PrescriptionDto> {
  const existing = await prescriptionRepository.findPrescriptionById(id);
  if (!existing) {
    throw ApiError.notFound("Prescription not found");
  }

  const trimmedReason = rejectionReason?.trim();
  if (status === "REJECTED" && !trimmedReason) {
    throw ApiError.badRequest("A rejection reason is required");
  }

  const prescription = await withTranslatedErrors(() =>
    prescriptionRepository.updatePrescriptionStatus(
      id,
      status,
      status === "REJECTED" ? (trimmedReason ?? null) : null,
    ),
  );
  return toPrescriptionDto(prescription);
}

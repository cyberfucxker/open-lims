import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import * as areaApprovalRequestRepository from "../repositories/areaApprovalRequest.repository";
import { toAreaApprovalRequestDto } from "../repositories/areaApprovalRequest.repository";
import * as organizationRepository from "../repositories/organization.repository";
import type {
  AreaApprovalRequestDto,
  CreateAreaApprovalRequestInput,
  ListAreaApprovalRequestsParams,
  ListAreaApprovalRequestsResult,
} from "../types/areaApproval.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/** A franchise proposing new coverage in its own city — see
 *  `AreaApprovalRequest`'s doc-comment for the full approve/reject flow.
 *  `organizationId`'s own `cityId` (set when the franchise was created from
 *  Superadmin) is what "its own city" means here — not a free picker, since
 *  the whole point is this stays scoped to where the franchise actually
 *  operates. */
export async function createAreaApprovalRequest(
  organizationId: string,
  input: CreateAreaApprovalRequestInput,
): Promise<AreaApprovalRequestDto> {
  const organization = await organizationRepository.findOrganizationById(organizationId);
  if (!organization?.cityId) {
    throw ApiError.badRequest(
      "Your franchise has no city on file — ask an admin to set one before requesting a new area",
    );
  }

  const name = input.name.trim();

  const existingArea = await prisma.area.findFirst({
    where: { cityId: organization.cityId, name: { equals: name, mode: "insensitive" } },
  });
  if (existingArea) {
    throw ApiError.conflict("An area with this name already exists in your city");
  }

  const pendingDuplicate = await areaApprovalRequestRepository.findPendingRequestByName(
    organizationId,
    name,
  );
  if (pendingDuplicate) {
    throw ApiError.conflict("You already have a pending request for this area name");
  }

  const request = await areaApprovalRequestRepository.createAreaApprovalRequest({
    organizationId,
    cityId: organization.cityId,
    name,
    pincodes: input.pincodes ?? [],
  });
  return toAreaApprovalRequestDto(request);
}

/** A franchise's own request history — every status, newest first. */
export async function listOwnAreaApprovalRequests(
  organizationId: string,
): Promise<AreaApprovalRequestDto[]> {
  const { rows } = await areaApprovalRequestRepository.listAreaApprovalRequests({
    organizationId,
  });
  return rows.map(toAreaApprovalRequestDto);
}

/** Superadmin's "Area Approval" tab — every franchise's requests, optionally
 *  filtered to one status (defaults to showing everything so admins can
 *  still see what they've already decided, not just the pending queue). */
export async function listAreaApprovalRequests(
  params: ListAreaApprovalRequestsParams,
): Promise<ListAreaApprovalRequestsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await areaApprovalRequestRepository.listAreaApprovalRequests({
    status: params.status,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toAreaApprovalRequestDto), total };
}

async function loadPendingRequest(id: string) {
  const request = await areaApprovalRequestRepository.findAreaApprovalRequestById(id);
  if (!request) {
    throw ApiError.notFound("Area request not found");
  }
  if (request.status !== "PENDING") {
    throw ApiError.conflict("This request has already been reviewed");
  }
  return request;
}

/** Approving creates the real `Area`, assigns it to the requesting
 *  franchise, and marks the request reviewed — all in one transaction, so a
 *  franchise is never left in the odd state of "approved, but the Area
 *  doesn't actually exist" or "the Area exists, but isn't assigned to
 *  anyone" from a failure partway through. A name collision that slipped
 *  past the request-time check (another area minted the same name in the
 *  meantime) surfaces the same friendly conflict `area.service.ts#createArea`
 *  would give, via the same unique-constraint translation. */
export async function approveAreaApprovalRequest(
  id: string,
  reviewedByUserId: string,
): Promise<AreaApprovalRequestDto> {
  const request = await loadPendingRequest(id);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const area = await tx.area.create({
        data: { cityId: request.cityId, name: request.name, pincodes: request.pincodes },
      });
      await organizationRepository.addServiceArea(request.organizationId, area.id, tx);
      return areaApprovalRequestRepository.markAreaApprovalRequestApprovedTx(tx, id, {
        approvedAreaId: area.id,
        reviewedByUserId,
      });
    });
    return toAreaApprovalRequestDto(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw ApiError.conflict("An area with this name already exists in this city");
    }
    throw error;
  }
}

export async function rejectAreaApprovalRequest(
  id: string,
  reviewedByUserId: string,
  reason?: string,
): Promise<AreaApprovalRequestDto> {
  await loadPendingRequest(id);
  const updated = await areaApprovalRequestRepository.markAreaApprovalRequestRejected(id, {
    rejectionReason: reason?.trim() || null,
    reviewedByUserId,
  });
  return toAreaApprovalRequestDto(updated);
}

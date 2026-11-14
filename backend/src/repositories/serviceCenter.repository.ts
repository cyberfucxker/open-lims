import type { Prisma, ServiceCenter } from "@prisma/client";
import { prisma } from "../config/database";
import type { ServiceCenterOptionDto } from "../types/appSlot.types";
import type { ServiceCenterDto } from "../types/serviceCenter.types";

/** Active service centers, id+name only — purely to populate an admin
 *  dropdown (e.g. the Slot Management "Center" field). */
export function listActiveServiceCenterOptions(): Promise<ServiceCenterOptionDto[]> {
  return prisma.serviceCenter.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export interface ListServiceCentersFilter {
  search?: string;
  isActive?: string;
  skip: number;
  take: number;
}

export interface ServiceCenterWriteInput {
  name: string;
  imageUrl?: string | null;
  address: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  latitude: number;
  longitude: number;
  /** 0–5, one decimal (`Decimal(2,1)`). Admin-entered: there's no patient
   *  review table to average, so the "4.6 (128 reviews)" a patient sees on
   *  the nearest-lab card is whatever the CMS was told — see
   *  `nearbyLabs.service.ts#getCenterDetail`. Omit on write to leave the
   *  stored value untouched on create (defaults to 0). */
  rating?: number;
  /** The count shown beside `rating`. Same reasoning: admin-entered, since
   *  nothing computes it. */
  reviewCount?: number;
  openingTime?: string | null;
  closingTime?: string | null;
  centerType?: string | null;
  isActive?: boolean;
  facilities?: string[];
  paymentMethods?: string[];
  photos?: string[];
  /** The franchise this lab card is assigned to — see
   *  `ServiceCenter.organizationId`'s doc-comment in schema.prisma. Omit to
   *  leave unset on create; pass `null` to clear it on update. */
  organizationId?: string | null;
}

type ServiceCenterWithOrganization = ServiceCenter & { organization: { name: string } | null };

/** Maps a Prisma row to the exact shape the frontend expects. */
export function toServiceCenterDto(center: ServiceCenterWithOrganization): ServiceCenterDto {
  return {
    id: center.id,
    name: center.name,
    imageUrl: center.imageUrl,
    address: center.address,
    phone: center.phone,
    email: center.email,
    website: center.website,
    latitude: Number(center.latitude),
    longitude: Number(center.longitude),
    rating: Number(center.rating),
    reviewCount: center.reviewCount,
    openingTime: center.openingTime,
    closingTime: center.closingTime,
    centerType: center.centerType,
    isActive: center.isActive,
    facilities: (center.facilities as string[] | null) ?? [],
    paymentMethods: (center.paymentMethods as string[] | null) ?? [],
    photos: (center.photos as string[] | null) ?? [],
    organizationId: center.organizationId,
    organizationName: center.organization?.name ?? null,
    createdAt: center.createdAt.toISOString(),
    updatedAt: center.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListServiceCentersFilter, "search" | "isActive">,
): Prisma.ServiceCenterWhereInput {
  const where: Prisma.ServiceCenterWhereInput = {};

  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { address: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter.isActive === "true") {
    where.isActive = true;
  } else if (filter.isActive === "false") {
    where.isActive = false;
  }

  return where;
}

const WITH_ORGANIZATION = {
  organization: { select: { name: true } },
} satisfies Prisma.ServiceCenterInclude;

export async function listServiceCenters(
  filter: ListServiceCentersFilter,
): Promise<{ rows: ServiceCenterWithOrganization[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.serviceCenter.findMany({
      where,
      include: WITH_ORGANIZATION,
      orderBy: { name: "asc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.serviceCenter.count({ where }),
  ]);

  return { rows, total };
}

export function findServiceCenterById(id: string) {
  return prisma.serviceCenter.findUnique({ where: { id }, include: WITH_ORGANIZATION });
}

export function createServiceCenter(data: ServiceCenterWriteInput) {
  return prisma.serviceCenter.create({
    data: {
      ...data,
      isActive: data.isActive ?? true,
      facilities: data.facilities ?? [],
      paymentMethods: data.paymentMethods ?? [],
      photos: data.photos ?? [],
    },
    include: WITH_ORGANIZATION,
  });
}

export function updateServiceCenter(id: string, data: ServiceCenterWriteInput) {
  return prisma.serviceCenter.update({ where: { id }, data, include: WITH_ORGANIZATION });
}

export function setServiceCenterStatus(id: string, isActive: boolean) {
  return prisma.serviceCenter.update({
    where: { id },
    data: { isActive },
    include: WITH_ORGANIZATION,
  });
}

export function deleteServiceCenter(id: string) {
  return prisma.serviceCenter.delete({ where: { id } });
}

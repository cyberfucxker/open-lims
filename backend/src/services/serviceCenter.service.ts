import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as serviceCenterRepository from "../repositories/serviceCenter.repository";
import {
  toServiceCenterDto,
  type ServiceCenterWriteInput,
} from "../repositories/serviceCenter.repository";
import type { ServiceCenterOptionDto } from "../types/appSlot.types";
import type {
  ListServiceCentersParams,
  ListServiceCentersResult,
  ServiceCenterDto,
} from "../types/serviceCenter.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Service center not found");
    }
    throw error;
  }
}

export function listActiveServiceCenterOptions(): Promise<ServiceCenterOptionDto[]> {
  return serviceCenterRepository.listActiveServiceCenterOptions();
}

export async function listServiceCenters(
  params: ListServiceCentersParams,
): Promise<ListServiceCentersResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await serviceCenterRepository.listServiceCenters({
    search: params.search,
    isActive: params.isActive,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toServiceCenterDto), total };
}

export async function getServiceCenter(id: string): Promise<ServiceCenterDto> {
  const center = await serviceCenterRepository.findServiceCenterById(id);
  if (!center) {
    throw ApiError.notFound("Service center not found");
  }
  return toServiceCenterDto(center);
}

export async function createServiceCenter(
  values: ServiceCenterWriteInput,
): Promise<ServiceCenterDto> {
  const center = await serviceCenterRepository.createServiceCenter(values);
  return toServiceCenterDto(center);
}

export async function updateServiceCenter(
  id: string,
  values: ServiceCenterWriteInput,
): Promise<ServiceCenterDto> {
  const center = await withTranslatedErrors(() =>
    serviceCenterRepository.updateServiceCenter(id, values),
  );
  return toServiceCenterDto(center);
}

export async function setServiceCenterStatus(
  id: string,
  isActive: boolean,
): Promise<ServiceCenterDto> {
  const center = await withTranslatedErrors(() =>
    serviceCenterRepository.setServiceCenterStatus(id, isActive),
  );
  return toServiceCenterDto(center);
}

export async function deleteServiceCenter(id: string): Promise<void> {
  await withTranslatedErrors(() => serviceCenterRepository.deleteServiceCenter(id));
}

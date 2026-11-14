import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as centerRepository from "../repositories/center.repository";
import { toCenterDto, type CenterWriteInput } from "../repositories/center.repository";
import type { CenterDto, ListCentersResult, ListMasterParams } from "../types/master.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Center not found");
      }
      if (error.code === "P2002") {
        throw ApiError.conflict("A center with this name already exists");
      }
    }
    throw error;
  }
}

export async function listCenters(params: ListMasterParams): Promise<ListCentersResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await centerRepository.listCenters({
    search: params.search,
    active: params.active,
    includeDeleted: params.includeDeleted === "true",
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toCenterDto), total };
}

export async function listActiveCenters(): Promise<CenterDto[]> {
  const rows = await centerRepository.listActiveCenters();
  return rows.map(toCenterDto);
}

export async function getCenter(id: string): Promise<CenterDto> {
  const center = await centerRepository.findCenterById(id);
  if (!center) {
    throw ApiError.notFound("Center not found");
  }
  return toCenterDto(center);
}

export async function createCenter(values: CenterWriteInput): Promise<CenterDto> {
  const center = await withTranslatedErrors(() => centerRepository.createCenter(values));
  return toCenterDto(center);
}

export async function updateCenter(id: string, values: CenterWriteInput): Promise<CenterDto> {
  const center = await withTranslatedErrors(() => centerRepository.updateCenter(id, values));
  return toCenterDto(center);
}

export async function deleteCenter(id: string): Promise<void> {
  await withTranslatedErrors(() => centerRepository.softDeleteCenter(id));
}

export async function restoreCenter(id: string): Promise<CenterDto> {
  const center = await withTranslatedErrors(() => centerRepository.restoreCenter(id));
  return toCenterDto(center);
}

export async function setCenterStatus(id: string, active: boolean): Promise<CenterDto> {
  const center = await withTranslatedErrors(() => centerRepository.setCenterStatus(id, active));
  return toCenterDto(center);
}

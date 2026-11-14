import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as areaRepository from "../repositories/area.repository";
import { toAreaDto, type AreaWriteInput } from "../repositories/area.repository";
import type { AreaDto, ListAreasParams, ListAreasResult } from "../types/area.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Area not found");
      }
      if (error.code === "P2002") {
        throw ApiError.conflict("An area with this name already exists in this city");
      }
      if (error.code === "P2003") {
        throw ApiError.badRequest("Selected city does not exist");
      }
    }
    throw error;
  }
}

export async function listAreas(params: ListAreasParams): Promise<ListAreasResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await areaRepository.listAreas({
    cityId: params.cityId,
    search: params.search,
    isActive: params.isActive,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toAreaDto), total };
}

export async function getArea(id: string): Promise<AreaDto> {
  const area = await areaRepository.findAreaById(id);
  if (!area) {
    throw ApiError.notFound("Area not found");
  }
  return toAreaDto(area);
}

export async function createArea(values: AreaWriteInput): Promise<AreaDto> {
  const area = await withTranslatedErrors(() => areaRepository.createArea(values));
  return toAreaDto(area);
}

export async function updateArea(id: string, values: AreaWriteInput): Promise<AreaDto> {
  const area = await withTranslatedErrors(() => areaRepository.updateArea(id, values));
  return toAreaDto(area);
}

export async function setAreaStatus(id: string, isActive: boolean): Promise<AreaDto> {
  const area = await withTranslatedErrors(() => areaRepository.setAreaStatus(id, isActive));
  return toAreaDto(area);
}

export async function setAreaPhlebotomyCharge(
  id: string,
  phlebotomyCharge: number | null,
): Promise<AreaDto> {
  const area = await withTranslatedErrors(() =>
    areaRepository.setAreaPhlebotomyCharge(id, phlebotomyCharge),
  );
  return toAreaDto(area);
}

export async function deleteArea(id: string): Promise<void> {
  await withTranslatedErrors(() => areaRepository.deleteArea(id));
}

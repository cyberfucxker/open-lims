import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { generateUniqueSlug } from "../utils/slug.util";
import * as cityRepository from "../repositories/city.repository";
import { toCityDto } from "../repositories/city.repository";
import { regenerateSitemapInBackground } from "./sitemapGenerator.service";
import type { CityDto, CityWriteData, ListCitiesResult } from "../types/master.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("City not found");
      }
      if (error.code === "P2002") {
        throw ApiError.conflict("A city with this name already exists");
      }
      if (error.code === "P2003") {
        throw ApiError.badRequest("Selected state does not exist");
      }
    }
    throw error;
  }
}

async function assertStateExists(stateId: string): Promise<void> {
  const state = await prisma.state.findUnique({ where: { id: stateId }, select: { id: true } });
  if (!state) {
    throw ApiError.badRequest("Selected state does not exist");
  }
}

export interface ListCitiesParams {
  search?: string;
  active?: string;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}

export async function listCities(params: ListCitiesParams): Promise<ListCitiesResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await cityRepository.listCities({
    search: params.search,
    active: params.active,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toCityDto), total };
}

export async function getCity(id: string): Promise<CityDto> {
  const city = await cityRepository.findCityById(id);
  if (!city) {
    throw ApiError.notFound("City not found");
  }
  return toCityDto(city);
}

export async function createCity(values: CityWriteData): Promise<CityDto> {
  await assertStateExists(values.stateId);

  const slug = await generateUniqueSlug(
    values.name,
    async (candidate) => !!(await cityRepository.findCityBySlug(candidate)),
    "city",
  );

  const city = await withTranslatedErrors(() => cityRepository.createCity({ ...values, slug }));
  regenerateSitemapInBackground();
  return toCityDto(city);
}

export async function updateCity(id: string, values: CityWriteData): Promise<CityDto> {
  const existing = await cityRepository.findCityById(id);
  if (!existing) {
    throw ApiError.notFound("City not found");
  }
  await assertStateExists(values.stateId);

  const city = await withTranslatedErrors(() => cityRepository.updateCity(id, values));
  regenerateSitemapInBackground();
  return toCityDto(city);
}

/** "Removing" a city — see `city.repository.ts#setCityStatus`'s doc-comment
 *  for why this deactivates rather than deletes. */
export async function setCityStatus(id: string, isActive: boolean): Promise<CityDto> {
  const city = await withTranslatedErrors(() => cityRepository.setCityStatus(id, isActive));
  regenerateSitemapInBackground();
  return toCityDto(city);
}

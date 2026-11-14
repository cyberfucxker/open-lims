import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as appCategoryRepository from "../repositories/appCategory.repository";
import {
  toAppCategoryDto,
  type AppCategoryWriteInput,
} from "../repositories/appCategory.repository";
import type {
  AppCategoryDto,
  ListAppCategoriesParams,
  ListAppCategoriesResult,
} from "../types/appCategory.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Category not found");
    }
    throw error;
  }
}

export async function listAppCategories(
  params: ListAppCategoriesParams,
): Promise<ListAppCategoriesResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await appCategoryRepository.listAppCategories({
    search: params.search,
    isActive: params.isActive,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toAppCategoryDto), total };
}

export async function getAppCategory(id: string): Promise<AppCategoryDto> {
  const category = await appCategoryRepository.findAppCategoryById(id);
  if (!category) {
    throw ApiError.notFound("Category not found");
  }
  return toAppCategoryDto(category);
}

export async function createAppCategory(values: AppCategoryWriteInput): Promise<AppCategoryDto> {
  const category = await appCategoryRepository.createAppCategory(values);
  return toAppCategoryDto(category);
}

export async function updateAppCategory(
  id: string,
  values: AppCategoryWriteInput,
): Promise<AppCategoryDto> {
  const category = await withTranslatedErrors(() =>
    appCategoryRepository.updateAppCategory(id, values),
  );
  return toAppCategoryDto(category);
}

export async function setAppCategoryStatus(id: string, isActive: boolean): Promise<AppCategoryDto> {
  const category = await withTranslatedErrors(() =>
    appCategoryRepository.setAppCategoryStatus(id, isActive),
  );
  return toAppCategoryDto(category);
}

export async function deleteAppCategory(id: string): Promise<void> {
  await withTranslatedErrors(() => appCategoryRepository.deleteAppCategory(id));
}

export async function reorderAppCategories(ids: string[]): Promise<void> {
  await withTranslatedErrors(() => appCategoryRepository.reorderAppCategories(ids));
}

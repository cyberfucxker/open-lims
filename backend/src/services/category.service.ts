import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as categoryRepository from "../repositories/category.repository";
import { toCategoryDto, type CategoryWriteInput } from "../repositories/category.repository";
import { findDepartmentById } from "../repositories/department.repository";
import type {
  CategoryDto,
  ListCategoriesParams,
  ListCategoriesResult,
} from "../types/master.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Category not found");
      }
      if (error.code === "P2002") {
        throw ApiError.conflict("A category with this name already exists in this department");
      }
    }
    throw error;
  }
}

async function assertDepartmentExists(departmentId: string): Promise<void> {
  const department = await findDepartmentById(departmentId);
  if (!department) {
    throw ApiError.badRequest("Selected department does not exist");
  }
}

export async function listCategories(params: ListCategoriesParams): Promise<ListCategoriesResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await categoryRepository.listCategories({
    search: params.search,
    active: params.active,
    includeDeleted: params.includeDeleted === "true",
    departmentId: params.departmentId,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toCategoryDto), total };
}

export async function getCategory(id: string): Promise<CategoryDto> {
  const category = await categoryRepository.findCategoryById(id);
  if (!category) {
    throw ApiError.notFound("Category not found");
  }
  return toCategoryDto(category);
}

export async function createCategory(values: CategoryWriteInput): Promise<CategoryDto> {
  await assertDepartmentExists(values.departmentId);
  const category = await withTranslatedErrors(() => categoryRepository.createCategory(values));
  return toCategoryDto(category);
}

export async function updateCategory(id: string, values: CategoryWriteInput): Promise<CategoryDto> {
  await assertDepartmentExists(values.departmentId);
  const category = await withTranslatedErrors(() => categoryRepository.updateCategory(id, values));
  return toCategoryDto(category);
}

export async function deleteCategory(id: string): Promise<void> {
  await withTranslatedErrors(() => categoryRepository.softDeleteCategory(id));
}

export async function restoreCategory(id: string): Promise<CategoryDto> {
  const category = await withTranslatedErrors(() => categoryRepository.restoreCategory(id));
  return toCategoryDto(category);
}

export async function setCategoryStatus(id: string, active: boolean): Promise<CategoryDto> {
  const category = await withTranslatedErrors(() =>
    categoryRepository.setCategoryStatus(id, active),
  );
  return toCategoryDto(category);
}

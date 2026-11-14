import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as departmentRepository from "../repositories/department.repository";
import { toDepartmentDto, type DepartmentWriteInput } from "../repositories/department.repository";
import type { DepartmentDto, ListDepartmentsResult, ListMasterParams } from "../types/master.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Department not found");
      }
      if (error.code === "P2002") {
        throw ApiError.conflict("A department with this name already exists");
      }
    }
    throw error;
  }
}

export async function listDepartments(params: ListMasterParams): Promise<ListDepartmentsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await departmentRepository.listDepartments({
    search: params.search,
    active: params.active,
    includeDeleted: params.includeDeleted === "true",
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toDepartmentDto), total };
}

export async function getDepartment(id: string): Promise<DepartmentDto> {
  const department = await departmentRepository.findDepartmentById(id);
  if (!department) {
    throw ApiError.notFound("Department not found");
  }
  return toDepartmentDto(department);
}

export async function createDepartment(values: DepartmentWriteInput): Promise<DepartmentDto> {
  const department = await withTranslatedErrors(() =>
    departmentRepository.createDepartment(values),
  );
  return toDepartmentDto(department);
}

export async function updateDepartment(
  id: string,
  values: DepartmentWriteInput,
): Promise<DepartmentDto> {
  const department = await withTranslatedErrors(() =>
    departmentRepository.updateDepartment(id, values),
  );
  return toDepartmentDto(department);
}

export async function deleteDepartment(id: string): Promise<void> {
  await withTranslatedErrors(() => departmentRepository.softDeleteDepartment(id));
}

export async function restoreDepartment(id: string): Promise<DepartmentDto> {
  const department = await withTranslatedErrors(() => departmentRepository.restoreDepartment(id));
  return toDepartmentDto(department);
}

export async function setDepartmentStatus(id: string, active: boolean): Promise<DepartmentDto> {
  const department = await withTranslatedErrors(() =>
    departmentRepository.setDepartmentStatus(id, active),
  );
  return toDepartmentDto(department);
}

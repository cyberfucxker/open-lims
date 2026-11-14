import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

export interface DepartmentDto {
  id: string;
  name: string;
  code: string;
  description: string;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDto {
  id: string;
  departmentId: string;
  department: string;
  name: string;
  code: string;
  description: string;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SampleTypeDto {
  id: string;
  name: string;
  description: string;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MasterDataListParams {
  search?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

export async function fetchDepartments(
  params: MasterDataListParams = {},
): Promise<PaginatedResult<DepartmentDto>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<DepartmentDto>>>(
    "/departments",
    { params: { pageSize: 100, ...params }, suppressErrorToast: true },
  );
  return response.data.data as PaginatedResult<DepartmentDto>;
}

export async function fetchCategories(
  params: MasterDataListParams & { departmentId?: string } = {},
): Promise<PaginatedResult<CategoryDto>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<CategoryDto>>>(
    "/categories",
    { params: { pageSize: 100, ...params }, suppressErrorToast: true },
  );
  return response.data.data as PaginatedResult<CategoryDto>;
}

export async function fetchSampleTypes(
  params: MasterDataListParams = {},
): Promise<PaginatedResult<SampleTypeDto>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<SampleTypeDto>>>(
    "/sample-types",
    { params: { pageSize: 100, ...params }, suppressErrorToast: true },
  );
  return response.data.data as PaginatedResult<SampleTypeDto>;
}

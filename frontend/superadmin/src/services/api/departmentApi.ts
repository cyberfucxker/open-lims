import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { DepartmentDto } from "./masterDataApi";

export type { DepartmentDto };

export interface DepartmentFormValues {
  name: string;
  code?: string | null;
  description?: string | null;
  active?: boolean;
}

export async function createDepartmentApi(values: DepartmentFormValues): Promise<DepartmentDto> {
  const response = await httpClient.post<ApiResponseBody<DepartmentDto>>("/departments", values, {
    suppressErrorToast: true,
  });
  return response.data.data as DepartmentDto;
}

export async function updateDepartmentApi(
  id: string,
  values: DepartmentFormValues,
): Promise<DepartmentDto> {
  const response = await httpClient.put<ApiResponseBody<DepartmentDto>>(
    `/departments/${id}`,
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as DepartmentDto;
}

/** Soft delete — sets `deletedAt`/`active:false` server-side rather than a hard
 *  row delete, so it never conflicts with categories/tests still referencing it. */
export async function deleteDepartmentApi(id: string): Promise<void> {
  await httpClient.delete(`/departments/${id}`, { suppressErrorToast: true });
}

export async function setDepartmentStatusApi(id: string, active: boolean): Promise<DepartmentDto> {
  const response = await httpClient.patch<ApiResponseBody<DepartmentDto>>(
    `/departments/${id}/status`,
    { active },
    { suppressErrorToast: true },
  );
  return response.data.data as DepartmentDto;
}

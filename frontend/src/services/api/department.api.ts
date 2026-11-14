import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  Department,
  DepartmentFormValues,
  ListDepartmentsResult,
  ListMasterParams,
} from "@/types/master";

export async function fetchDepartments(
  params: ListMasterParams = {},
): Promise<ListDepartmentsResult> {
  const response = await httpClient.get<ApiResponseBody<ListDepartmentsResult>>("/departments", {
    params,
  });
  return response.data.data as ListDepartmentsResult;
}

export async function fetchDepartment(id: string): Promise<Department> {
  const response = await httpClient.get<ApiResponseBody<Department>>(`/departments/${id}`);
  return response.data.data as Department;
}

export async function createDepartmentApi(values: DepartmentFormValues): Promise<Department> {
  const response = await httpClient.post<ApiResponseBody<Department>>("/departments", values);
  return response.data.data as Department;
}

export async function updateDepartmentApi(
  id: string,
  values: DepartmentFormValues,
): Promise<Department> {
  const response = await httpClient.put<ApiResponseBody<Department>>(`/departments/${id}`, values);
  return response.data.data as Department;
}

export async function deleteDepartmentApi(id: string): Promise<void> {
  await httpClient.delete(`/departments/${id}`);
}

export async function restoreDepartmentApi(id: string): Promise<Department> {
  const response = await httpClient.patch<ApiResponseBody<Department>>(
    `/departments/${id}/restore`,
  );
  return response.data.data as Department;
}

export async function setDepartmentStatusApi(id: string, active: boolean): Promise<Department> {
  const response = await httpClient.patch<ApiResponseBody<Department>>(
    `/departments/${id}/status`,
    { active },
  );
  return response.data.data as Department;
}

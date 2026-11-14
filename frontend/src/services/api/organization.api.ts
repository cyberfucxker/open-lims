import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  EnableLoginValues,
  ListOrganizationsParams,
  ListOrganizationsResult,
  Organization,
  OrganizationAuditLog,
  OrganizationFormValues,
  UpdateLoginValues,
} from "@/types/organization";

export async function fetchOrganizations(
  params: ListOrganizationsParams = {},
): Promise<ListOrganizationsResult> {
  const response = await httpClient.get<ApiResponseBody<ListOrganizationsResult>>(
    "/organizations",
    { params },
  );
  return response.data.data as ListOrganizationsResult;
}

export async function fetchOrganization(id: string): Promise<Organization> {
  const response = await httpClient.get<ApiResponseBody<Organization>>(`/organizations/${id}`);
  return response.data.data as Organization;
}

export async function fetchMyOrganization(): Promise<Organization> {
  const response = await httpClient.get<ApiResponseBody<Organization>>("/organizations/me");
  return response.data.data as Organization;
}

export async function createOrganizationApi(values: OrganizationFormValues): Promise<Organization> {
  const response = await httpClient.post<ApiResponseBody<Organization>>("/organizations", values);
  return response.data.data as Organization;
}

export async function updateOrganizationApi(
  id: string,
  values: OrganizationFormValues,
): Promise<Organization> {
  const response = await httpClient.put<ApiResponseBody<Organization>>(
    `/organizations/${id}`,
    values,
  );
  return response.data.data as Organization;
}

export async function deleteOrganizationApi(id: string): Promise<void> {
  await httpClient.delete(`/organizations/${id}`);
}

export async function restoreOrganizationApi(id: string): Promise<Organization> {
  const response = await httpClient.patch<ApiResponseBody<Organization>>(
    `/organizations/${id}/restore`,
  );
  return response.data.data as Organization;
}

export async function setOrganizationStatusApi(id: string, active: boolean): Promise<Organization> {
  const response = await httpClient.patch<ApiResponseBody<Organization>>(
    `/organizations/${id}/status`,
    { active },
  );
  return response.data.data as Organization;
}

export async function enableLoginApi(id: string, values: EnableLoginValues): Promise<Organization> {
  const response = await httpClient.post<ApiResponseBody<Organization>>(
    `/organizations/${id}/login`,
    values,
  );
  return response.data.data as Organization;
}

export async function updateLoginApi(id: string, values: UpdateLoginValues): Promise<Organization> {
  const response = await httpClient.patch<ApiResponseBody<Organization>>(
    `/organizations/${id}/login`,
    values,
  );
  return response.data.data as Organization;
}

export async function disableLoginApi(id: string): Promise<Organization> {
  const response = await httpClient.delete<ApiResponseBody<Organization>>(
    `/organizations/${id}/login`,
  );
  return response.data.data as Organization;
}

export async function fetchOrganizationAuditLogs(id: string): Promise<OrganizationAuditLog[]> {
  const response = await httpClient.get<ApiResponseBody<OrganizationAuditLog[]>>(
    `/organizations/${id}/audit-logs`,
  );
  return response.data.data as OrganizationAuditLog[];
}

export async function fetchOrganizationsExcelBlob(
  params: ListOrganizationsParams = {},
): Promise<Blob> {
  const response = await httpClient.get("/organizations/export/excel", {
    params,
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

export async function fetchOrganizationsPdfBlob(
  params: ListOrganizationsParams = {},
): Promise<Blob> {
  const response = await httpClient.get("/organizations/export/pdf", {
    params,
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

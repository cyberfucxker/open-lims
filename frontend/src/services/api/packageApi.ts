import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  LabPackage,
  ListPackagesParams,
  ListPackagesResult,
  PackageFormValues,
} from "@/types/package";

/** Real `/packages` endpoints — mirrors `testApi.ts`'s conventions. */
export async function fetchPackages(params: ListPackagesParams = {}): Promise<ListPackagesResult> {
  const response = await httpClient.get<ApiResponseBody<ListPackagesResult>>("/packages", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as ListPackagesResult;
}

export async function fetchPackage(id: string): Promise<LabPackage> {
  const response = await httpClient.get<ApiResponseBody<LabPackage>>(`/packages/${id}`, {
    suppressErrorToast: true,
  });
  return response.data.data as LabPackage;
}

export async function createPackageApi(values: PackageFormValues): Promise<LabPackage> {
  const response = await httpClient.post<ApiResponseBody<LabPackage>>("/packages", values, {
    suppressErrorToast: true,
  });
  return response.data.data as LabPackage;
}

export async function updatePackageApi(id: string, values: PackageFormValues): Promise<LabPackage> {
  const response = await httpClient.put<ApiResponseBody<LabPackage>>(`/packages/${id}`, values, {
    suppressErrorToast: true,
  });
  return response.data.data as LabPackage;
}

export async function deletePackageApi(id: string): Promise<void> {
  await httpClient.delete(`/packages/${id}`, { suppressErrorToast: true });
}

export async function setPackageStatusApi(id: string, active: boolean): Promise<LabPackage> {
  const response = await httpClient.patch<ApiResponseBody<LabPackage>>(
    `/packages/${id}/status`,
    { active },
    { suppressErrorToast: true },
  );
  return response.data.data as LabPackage;
}

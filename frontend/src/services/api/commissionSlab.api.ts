import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  CommissionSlab,
  CommissionSlabFormValues,
  ListCommissionSlabsResult,
} from "@/types/commissionSlab";

export async function fetchCommissionSlabs(): Promise<ListCommissionSlabsResult> {
  const response =
    await httpClient.get<ApiResponseBody<ListCommissionSlabsResult>>("/commission-slabs");
  return response.data.data as ListCommissionSlabsResult;
}

export async function createCommissionSlabApi(
  values: CommissionSlabFormValues,
): Promise<CommissionSlab> {
  const response = await httpClient.post<ApiResponseBody<CommissionSlab>>(
    "/commission-slabs",
    values,
  );
  return response.data.data as CommissionSlab;
}

export async function updateCommissionSlabApi(
  id: string,
  values: CommissionSlabFormValues,
): Promise<CommissionSlab> {
  const response = await httpClient.put<ApiResponseBody<CommissionSlab>>(
    `/commission-slabs/${id}`,
    values,
  );
  return response.data.data as CommissionSlab;
}

export async function deleteCommissionSlabApi(id: string): Promise<void> {
  await httpClient.delete(`/commission-slabs/${id}`);
}

export async function setCommissionSlabStatusApi(
  id: string,
  active: boolean,
): Promise<CommissionSlab> {
  const response = await httpClient.patch<ApiResponseBody<CommissionSlab>>(
    `/commission-slabs/${id}/status`,
    { active },
  );
  return response.data.data as CommissionSlab;
}

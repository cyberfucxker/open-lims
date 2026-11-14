import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  ListMarketingStaffParams,
  ListMarketingStaffResult,
  MarketingStaff,
  MarketingStaffFormValues,
} from "@/types/marketingStaff";

export async function fetchMarketingStaff(
  params: ListMarketingStaffParams = {},
): Promise<ListMarketingStaffResult> {
  const response = await httpClient.get<ApiResponseBody<ListMarketingStaffResult>>(
    "/marketing-staff",
    { params },
  );
  return response.data.data as ListMarketingStaffResult;
}

export async function fetchMarketingStaffMember(id: string): Promise<MarketingStaff> {
  const response = await httpClient.get<ApiResponseBody<MarketingStaff>>(`/marketing-staff/${id}`);
  return response.data.data as MarketingStaff;
}

export async function createMarketingStaffApi(
  values: MarketingStaffFormValues,
): Promise<MarketingStaff> {
  const response = await httpClient.post<ApiResponseBody<MarketingStaff>>(
    "/marketing-staff",
    values,
  );
  return response.data.data as MarketingStaff;
}

export async function updateMarketingStaffApi(
  id: string,
  values: MarketingStaffFormValues,
): Promise<MarketingStaff> {
  const response = await httpClient.put<ApiResponseBody<MarketingStaff>>(
    `/marketing-staff/${id}`,
    values,
  );
  return response.data.data as MarketingStaff;
}

export async function deleteMarketingStaffApi(id: string): Promise<void> {
  await httpClient.delete(`/marketing-staff/${id}`);
}

export async function restoreMarketingStaffApi(id: string): Promise<MarketingStaff> {
  const response = await httpClient.patch<ApiResponseBody<MarketingStaff>>(
    `/marketing-staff/${id}/restore`,
  );
  return response.data.data as MarketingStaff;
}

export async function setMarketingStaffStatusApi(
  id: string,
  status: boolean,
): Promise<MarketingStaff> {
  const response = await httpClient.patch<ApiResponseBody<MarketingStaff>>(
    `/marketing-staff/${id}/status`,
    { status },
  );
  return response.data.data as MarketingStaff;
}

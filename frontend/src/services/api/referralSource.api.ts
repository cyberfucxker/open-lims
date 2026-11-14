import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  ListReferralSourcesParams,
  ListReferralSourcesResult,
  PriceListAssignmentView,
  ReferralSource,
  ReferralSourceFormValues,
} from "@/types/referralSource";

export async function fetchReferralSources(
  params: ListReferralSourcesParams = {},
): Promise<ListReferralSourcesResult> {
  const response = await httpClient.get<ApiResponseBody<ListReferralSourcesResult>>(
    "/referral-sources",
    { params },
  );
  return response.data.data as ListReferralSourcesResult;
}

export async function fetchReferralSource(id: string): Promise<ReferralSource> {
  const response = await httpClient.get<ApiResponseBody<ReferralSource>>(`/referral-sources/${id}`);
  return response.data.data as ReferralSource;
}

export async function createReferralSourceApi(
  values: ReferralSourceFormValues,
): Promise<ReferralSource> {
  const response = await httpClient.post<ApiResponseBody<ReferralSource>>(
    "/referral-sources",
    values,
  );
  return response.data.data as ReferralSource;
}

export async function updateReferralSourceApi(
  id: string,
  values: ReferralSourceFormValues,
): Promise<ReferralSource> {
  const response = await httpClient.put<ApiResponseBody<ReferralSource>>(
    `/referral-sources/${id}`,
    values,
  );
  return response.data.data as ReferralSource;
}

export async function deleteReferralSourceApi(id: string): Promise<void> {
  await httpClient.delete(`/referral-sources/${id}`);
}

export async function restoreReferralSourceApi(id: string): Promise<ReferralSource> {
  const response = await httpClient.patch<ApiResponseBody<ReferralSource>>(
    `/referral-sources/${id}/restore`,
  );
  return response.data.data as ReferralSource;
}

export async function setReferralSourceStatusApi(
  id: string,
  status: boolean,
): Promise<ReferralSource> {
  const response = await httpClient.patch<ApiResponseBody<ReferralSource>>(
    `/referral-sources/${id}/status`,
    { status },
  );
  return response.data.data as ReferralSource;
}

export async function assignPriceListApi(id: string, priceListId: string): Promise<ReferralSource> {
  const response = await httpClient.put<ApiResponseBody<ReferralSource>>(
    `/referral-sources/${id}/price-list`,
    { priceListId },
  );
  return response.data.data as ReferralSource;
}

export async function removePriceListApi(id: string): Promise<ReferralSource> {
  const response = await httpClient.delete<ApiResponseBody<ReferralSource>>(
    `/referral-sources/${id}/price-list`,
  );
  return response.data.data as ReferralSource;
}

export async function fetchPriceListAssignment(id: string): Promise<PriceListAssignmentView> {
  const response = await httpClient.get<ApiResponseBody<PriceListAssignmentView>>(
    `/referral-sources/${id}/price-list`,
  );
  return response.data.data as PriceListAssignmentView;
}

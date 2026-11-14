import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

export interface RechargeOffer {
  id: string;
  rechargeAmount: number;
  bonusAmount: number;
  creditAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RechargeOfferListParams {
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface RechargeOfferFormValues {
  rechargeAmount: number;
  bonusAmount: number;
  isActive?: boolean;
}

export async function fetchRechargeOffers(
  params: RechargeOfferListParams = {},
): Promise<PaginatedResult<RechargeOffer>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<RechargeOffer>>>(
    "/recharge-offers",
    {
      params,
      suppressErrorToast: true,
    },
  );
  return response.data.data as PaginatedResult<RechargeOffer>;
}

export async function createRechargeOfferApi(
  values: RechargeOfferFormValues,
): Promise<RechargeOffer> {
  const response = await httpClient.post<ApiResponseBody<RechargeOffer>>(
    "/recharge-offers",
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as RechargeOffer;
}

export async function updateRechargeOfferApi(
  id: string,
  values: RechargeOfferFormValues,
): Promise<RechargeOffer> {
  const response = await httpClient.put<ApiResponseBody<RechargeOffer>>(
    `/recharge-offers/${id}`,
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as RechargeOffer;
}

export async function setRechargeOfferStatusApi(
  id: string,
  isActive: boolean,
): Promise<RechargeOffer> {
  const response = await httpClient.patch<ApiResponseBody<RechargeOffer>>(
    `/recharge-offers/${id}/status`,
    { isActive },
    { suppressErrorToast: true },
  );
  return response.data.data as RechargeOffer;
}

export async function deleteRechargeOfferApi(id: string): Promise<void> {
  await httpClient.delete<ApiResponseBody<null>>(`/recharge-offers/${id}`, {
    suppressErrorToast: true,
  });
}

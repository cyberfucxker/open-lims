import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  GenerateSettlementInput,
  ListReferralSettlementsParams,
  ListReferralSettlementsResult,
  ReferralSettlement,
  ReferralSettlementDetails,
} from "@/types/referralSettlement";

export async function fetchReferralSettlements(
  params: ListReferralSettlementsParams = {},
): Promise<ListReferralSettlementsResult> {
  const response = await httpClient.get<ApiResponseBody<ListReferralSettlementsResult>>(
    "/referral-settlements",
    { params, suppressErrorToast: true },
  );
  return response.data.data as ListReferralSettlementsResult;
}

export async function fetchReferralSettlement(id: string): Promise<ReferralSettlementDetails> {
  const response = await httpClient.get<ApiResponseBody<ReferralSettlementDetails>>(
    `/referral-settlements/${id}`,
    { suppressErrorToast: true },
  );
  return response.data.data as ReferralSettlementDetails;
}

export async function generateSettlementApi(
  values: GenerateSettlementInput,
): Promise<ReferralSettlement> {
  const response = await httpClient.post<ApiResponseBody<ReferralSettlement>>(
    "/referral-settlements",
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as ReferralSettlement;
}

export async function markSettlementPaidApi(id: string): Promise<ReferralSettlement> {
  const response = await httpClient.patch<ApiResponseBody<ReferralSettlement>>(
    `/referral-settlements/${id}/mark-paid`,
    {},
    { suppressErrorToast: true },
  );
  return response.data.data as ReferralSettlement;
}

export async function cancelSettlementApi(id: string): Promise<ReferralSettlement> {
  const response = await httpClient.patch<ApiResponseBody<ReferralSettlement>>(
    `/referral-settlements/${id}/cancel`,
    {},
    { suppressErrorToast: true },
  );
  return response.data.data as ReferralSettlement;
}

export async function fetchSettlementsExcelBlob(
  params: ListReferralSettlementsParams = {},
): Promise<Blob> {
  const response = await httpClient.get("/referral-settlements/export/excel", {
    params,
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

export async function fetchSettlementsPdfBlob(
  params: ListReferralSettlementsParams = {},
): Promise<Blob> {
  const response = await httpClient.get("/referral-settlements/export/pdf", {
    params,
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

export async function fetchSingleSettlementPdfBlob(id: string): Promise<Blob> {
  const response = await httpClient.get(`/referral-settlements/${id}/export/pdf`, {
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

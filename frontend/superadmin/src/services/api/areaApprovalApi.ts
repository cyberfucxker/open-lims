import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

/** Superadmin's "Area Approval" tab (Cities & Areas) — review every
 *  franchise's self-service new-area requests (`POST /franchise/area-requests`).
 *  See the backend's `AreaApprovalRequest` doc-comment for what approve/
 *  reject actually do. */

export type AreaApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AreaApprovalRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  cityId: string;
  cityName: string;
  name: string;
  pincodes: string[];
  status: AreaApprovalStatus;
  rejectionReason: string | null;
  approvedAreaId: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface ListAreaApprovalRequestsParams {
  status?: AreaApprovalStatus;
  page?: number;
  pageSize?: number;
}

export async function fetchAreaApprovalRequests(
  params: ListAreaApprovalRequestsParams,
): Promise<{ rows: AreaApprovalRequest[]; total: number }> {
  const response = await httpClient.get<
    ApiResponseBody<{ rows: AreaApprovalRequest[]; total: number }>
  >("/area-approval-requests", { params, suppressErrorToast: true });
  return response.data.data as { rows: AreaApprovalRequest[]; total: number };
}

export async function approveAreaApprovalRequest(id: string): Promise<AreaApprovalRequest> {
  const response = await httpClient.patch<ApiResponseBody<AreaApprovalRequest>>(
    `/area-approval-requests/${id}/approve`,
    {},
    { suppressErrorToast: true },
  );
  return response.data.data as AreaApprovalRequest;
}

export async function rejectAreaApprovalRequest(
  id: string,
  reason?: string,
): Promise<AreaApprovalRequest> {
  const response = await httpClient.patch<ApiResponseBody<AreaApprovalRequest>>(
    `/area-approval-requests/${id}/reject`,
    { reason },
    { suppressErrorToast: true },
  );
  return response.data.data as AreaApprovalRequest;
}

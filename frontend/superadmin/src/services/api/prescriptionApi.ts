import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

export type PrescriptionStatus = "SUBMITTED" | "APPROVED" | "REJECTED";

/** Mirrors the backend's `PrescriptionDto` (GET /prescriptions) — a
 *  prescription a patient uploaded from the app for the team to read and turn
 *  into a booking. */
export interface Prescription {
  id: string;
  /** Who it is FOR. Null when the family member was deleted after upload —
   *  the account holder below is always present, so there is still someone to
   *  call back. */
  patientName: string | null;
  patientMobile: string | null;
  relation: string | null;
  customerId: string;
  customerName: string;
  customerMobile: string;
  cityId: string | null;
  cityName: string | null;
  query: string | null;
  fileUrl: string;
  status: PrescriptionStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionListParams {
  search?: string;
  status?: PrescriptionStatus;
  cityId?: string;
  page?: number;
  pageSize?: number;
}

/** `statusCounts` covers the whole filtered set ignoring the status filter, so
 *  the tabs keep showing the size of the queue rather than only the tab being
 *  viewed. */
export type PrescriptionListResult = PaginatedResult<Prescription> & {
  statusCounts: Record<PrescriptionStatus, number>;
};

export async function fetchPrescriptions(
  params: PrescriptionListParams = {},
): Promise<PrescriptionListResult> {
  const response = await httpClient.get<ApiResponseBody<PrescriptionListResult>>("/prescriptions", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as PrescriptionListResult;
}

export async function setPrescriptionStatusApi(
  id: string,
  status: PrescriptionStatus,
  rejectionReason?: string,
): Promise<Prescription> {
  const response = await httpClient.patch<ApiResponseBody<Prescription>>(
    `/prescriptions/${id}/status`,
    { status, rejectionReason },
    { suppressErrorToast: true },
  );
  return response.data.data as Prescription;
}

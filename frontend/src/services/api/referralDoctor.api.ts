import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  ListReferralDoctorsParams,
  ListReferralDoctorsResult,
  ReferralDoctor,
  ReferralDoctorFormValues,
} from "@/types/referralDoctor";

export async function fetchReferralDoctors(
  params: ListReferralDoctorsParams = {},
): Promise<ListReferralDoctorsResult> {
  const response = await httpClient.get<ApiResponseBody<ListReferralDoctorsResult>>(
    "/referral-doctors",
    { params },
  );
  return response.data.data as ListReferralDoctorsResult;
}

export async function fetchReferralDoctor(id: string): Promise<ReferralDoctor> {
  const response = await httpClient.get<ApiResponseBody<ReferralDoctor>>(`/referral-doctors/${id}`);
  return response.data.data as ReferralDoctor;
}

export async function fetchActiveReferralDoctors(): Promise<ReferralDoctor[]> {
  const response = await httpClient.get<ApiResponseBody<ReferralDoctor[]>>(
    "/referral-doctors/active",
  );
  return response.data.data as ReferralDoctor[];
}

export async function createReferralDoctorApi(
  values: ReferralDoctorFormValues,
): Promise<ReferralDoctor> {
  const response = await httpClient.post<ApiResponseBody<ReferralDoctor>>(
    "/referral-doctors",
    values,
  );
  return response.data.data as ReferralDoctor;
}

export async function updateReferralDoctorApi(
  id: string,
  values: ReferralDoctorFormValues,
): Promise<ReferralDoctor> {
  const response = await httpClient.put<ApiResponseBody<ReferralDoctor>>(
    `/referral-doctors/${id}`,
    values,
  );
  return response.data.data as ReferralDoctor;
}

export async function deleteReferralDoctorApi(id: string): Promise<void> {
  await httpClient.delete(`/referral-doctors/${id}`);
}

export async function restoreReferralDoctorApi(id: string): Promise<ReferralDoctor> {
  const response = await httpClient.patch<ApiResponseBody<ReferralDoctor>>(
    `/referral-doctors/${id}/restore`,
  );
  return response.data.data as ReferralDoctor;
}

export async function setReferralDoctorStatusApi(
  id: string,
  status: boolean,
): Promise<ReferralDoctor> {
  const response = await httpClient.patch<ApiResponseBody<ReferralDoctor>>(
    `/referral-doctors/${id}/status`,
    { status },
  );
  return response.data.data as ReferralDoctor;
}

export async function assignReferralDoctorApi(
  id: string,
  marketingStaffId: string,
): Promise<ReferralDoctor> {
  const response = await httpClient.patch<ApiResponseBody<ReferralDoctor>>(
    `/referral-doctors/${id}/assign`,
    { marketingStaffId },
  );
  return response.data.data as ReferralDoctor;
}

export async function bulkAssignReferralDoctorsApi(
  doctorIds: string[],
  marketingStaffId: string,
): Promise<ReferralDoctor[]> {
  const response = await httpClient.patch<ApiResponseBody<ReferralDoctor[]>>(
    "/referral-doctors/bulk-assign",
    { doctorIds, marketingStaffId },
  );
  return response.data.data as ReferralDoctor[];
}

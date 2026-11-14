import { httpClient } from "./httpClient";
import type { ApiResponseBody } from "@/types/api";

export interface StaffUser {
  id: string;
  username: string;
  fullName: string | null;
  role: string;
  staffModules: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export async function fetchStaffUsers(): Promise<StaffUser[]> {
  const response = await httpClient.get<ApiResponseBody<StaffUser[]>>("/staff-users");
  return response.data.data ?? [];
}

export async function createManagerApi(input: {
  username: string;
  fullName: string;
  password: string;
  staffModules: string[];
}): Promise<StaffUser> {
  const response = await httpClient.post<ApiResponseBody<StaffUser>>("/staff-users", input, {
    suppressErrorToast: true,
  });
  return response.data.data as StaffUser;
}

export async function updateManagerApi(
  id: string,
  input: { fullName?: string; staffModules?: string[]; isActive?: boolean },
): Promise<StaffUser> {
  const response = await httpClient.patch<ApiResponseBody<StaffUser>>(`/staff-users/${id}`, input, {
    suppressErrorToast: true,
  });
  return response.data.data as StaffUser;
}

export async function resetManagerPasswordApi(id: string, password: string): Promise<void> {
  await httpClient.post(
    `/staff-users/${id}/reset-password`,
    { password },
    { suppressErrorToast: true },
  );
}

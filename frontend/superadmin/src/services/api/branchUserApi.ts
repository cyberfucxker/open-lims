import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

/** A branch login (FRANCHISE-role staff user) the Test form's "Branch User"
 *  picker offers. Read-only — see `branchUser.service.ts` on the backend for why
 *  this isn't a full users module. */
export interface BranchUserDto {
  id: string;
  username: string;
  fullName: string | null;
  organizationName: string | null;
  isActive: boolean;
}

export async function fetchBranchUsers(search?: string): Promise<BranchUserDto[]> {
  const response = await httpClient.get<ApiResponseBody<BranchUserDto[]>>("/branch-users", {
    params: search ? { search } : undefined,
    suppressErrorToast: true,
  });
  return response.data.data as BranchUserDto[];
}

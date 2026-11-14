import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { Role } from "@/types/role";

export async function fetchRoles(): Promise<Role[]> {
  const response = await httpClient.get<ApiResponseBody<Role[]>>("/roles");
  return response.data.data as Role[];
}

import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { AuthUser, LoginCredentials, LoginResponse } from "@/types/auth";

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await httpClient.post<ApiResponseBody<LoginResponse>>(
    "/auth/login",
    { username: credentials.username, password: credentials.password },
    { suppressErrorToast: true },
  );
  return response.data.data as LoginResponse;
}

export async function logout(refreshToken: string): Promise<void> {
  await httpClient.post("/auth/logout", { refreshToken }, { suppressErrorToast: true });
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await httpClient.get<ApiResponseBody<AuthUser>>("/auth/me", {
    suppressErrorToast: true,
  });
  return response.data.data as AuthUser;
}

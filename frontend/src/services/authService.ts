import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  AuthUser,
  ForgotPasswordResponse,
  LoginCredentials,
  LoginResponse,
} from "@/types/auth";

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

export async function forgotPassword(username: string): Promise<ForgotPasswordResponse> {
  const response = await httpClient.post<ApiResponseBody<ForgotPasswordResponse>>(
    "/auth/forgot-password",
    { username },
  );
  return response.data.data ?? {};
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await httpClient.post("/auth/reset-password", { token, newPassword });
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await httpClient.get<ApiResponseBody<AuthUser>>("/auth/me", {
    suppressErrorToast: true,
  });
  return response.data.data as AuthUser;
}

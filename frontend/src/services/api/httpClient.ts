import axios, { type AxiosError } from "axios";
import { toast } from "sonner";

import type { ApiResponseBody } from "@/types/api";
import type { AuthTokens } from "@/types/auth";
import {
  clearStoredRefreshToken,
  getStoredRefreshToken,
  updateStoredRefreshToken,
} from "@/utils/authStorage";
import { ApiRequestError, type ApiFieldError } from "./ApiRequestError";
import { getAccessToken, notifySessionExpired, setAccessToken } from "./tokenStore";

const baseURL = import.meta.env.VITE_API_BASE_URL as string;

export const httpClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

/** Bare instance with no interceptors, used only for the refresh call itself
 *  so a failing refresh never re-enters this same 401 handling chain. */
const refreshClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

function normalizeError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponseBody>;
    if (!axiosError.response) {
      return new ApiRequestError("Network error. Please check your connection and try again.");
    }
    const body = axiosError.response.data;
    const details = body?.meta?.details as ApiFieldError[] | undefined;
    return new ApiRequestError(
      body?.message || "Something went wrong. Please try again.",
      axiosError.response.status,
      details,
    );
  }

  return new ApiRequestError("Something went wrong. Please try again.");
}

// Concurrent 401s share one in-flight refresh instead of each firing their own.
let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new ApiRequestError("No active session", 401);
  }

  try {
    const response = await refreshClient.post<ApiResponseBody<AuthTokens>>("/auth/refresh-token", {
      refreshToken,
    });
    const tokens = response.data.data;
    if (!tokens) {
      throw new ApiRequestError("Session refresh failed", 401);
    }

    setAccessToken(tokens.accessToken);
    updateStoredRefreshToken(tokens.refreshToken);
    return tokens.accessToken;
  } catch (error) {
    throw normalizeError(error);
  }
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config;
    const status = error.response?.status;
    const isAuthLifecycleEndpoint =
      config?.url?.includes("/auth/login") || config?.url?.includes("/auth/refresh-token");

    if (status === 401 && config && !config._retry && !isAuthLifecycleEndpoint) {
      config._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newAccessToken = await refreshPromise;
        config.headers.set("Authorization", `Bearer ${newAccessToken}`);
        return await httpClient(config);
      } catch {
        setAccessToken(null);
        clearStoredRefreshToken();
        notifySessionExpired();
        return Promise.reject(normalizeError(error));
      }
    }

    const normalized = normalizeError(error);
    if (!config?.suppressErrorToast) {
      toast.error(normalized.message);
    }
    return Promise.reject(normalized);
  },
);

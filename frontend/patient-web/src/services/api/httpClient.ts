import axios, { type AxiosError } from "axios";

import { useAuthStore } from "@/store/authStore";
import type { AppApiResponseBody } from "@/types/common";
import { ApiRequestError, type ApiFieldError } from "./ApiRequestError";

const baseURL = import.meta.env.VITE_API_BASE_URL as string;

/** Origin the backend serves `/uploads/*` static files from — `baseURL`
 *  includes the `/api/v1/app` prefix, which uploaded-file paths aren't under. */
const apiOrigin = baseURL.replace(/\/api\/v1\/app\/?$/, "");

/** Resolves a backend-relative path (e.g. `/uploads/banner-....png`) to an
 *  absolute URL. Already-absolute URLs (or empty/nullish paths) pass through
 *  unchanged — mirrors the same helper in the superadmin app's httpClient. */
export function resolveUploadUrl(path: string): string;
export function resolveUploadUrl(path: string | null): string | null;
export function resolveUploadUrl(path: string | null): string | null {
  if (!path) return path;
  return /^https?:\/\//i.test(path) ? path : `${apiOrigin}${path}`;
}

export const httpClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

/** App users get a single long-lived access token (no refresh-token concept,
 *  unlike the staff/superadmin apps) — the store itself is the source of
 *  truth for the token, so there's no separate in-memory tokenStore here. */
httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
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
    const axiosError = error as AxiosError<AppApiResponseBody<null>>;
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

const AUTH_LIFECYCLE_PATHS = ["/user/login", "/user/verify-otp"];

/** No global error toast here, deliberately — every call site already
 *  catches `ApiRequestError` and surfaces `.message` itself (same pattern
 *  the mock layer used), so a second toast here would just duplicate it. */
httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const isAuthLifecycleEndpoint = AUTH_LIFECYCLE_PATHS.some((path) =>
      error.config?.url?.includes(path),
    );

    if (status === 401 && !isAuthLifecycleEndpoint) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(normalizeError(error));
  },
);

import { httpClient } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type { CompleteProfileRequest, LoginResult, VerifyOtpResult } from "@/types";

/** The date input on Complete Profile yields ISO (`YYYY-MM-DD`); the backend's
 *  `complete-profile` endpoint parses `d_o_b` as `DD-MM-YYYY` (see its OpenAPI
 *  example) — converted here so callers keep passing the native date input value. */
function toBackendDob(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
}

export const authApi = {
  async login(mobile: string): Promise<LoginResult> {
    const response = await httpClient.post<AppApiResponseBody<LoginResult>>("/user/login", {
      mobile,
    });
    return response.data.data ?? {};
  },

  async verifyOtp(mobile: string, otp: string): Promise<VerifyOtpResult> {
    const response = await httpClient.post<AppApiResponseBody<VerifyOtpResult>>(
      "/user/verify-otp",
      {
        mobile,
        otp,
      },
    );
    return response.data.data as VerifyOtpResult;
  },

  async completeProfile(payload: CompleteProfileRequest): Promise<null> {
    const form = new FormData();
    form.append("name", payload.name);
    form.append("sex", payload.sex);
    form.append("d_o_b", toBackendDob(payload.d_o_b));
    if (payload.email) form.append("email", payload.email);
    if (payload.patient_city) form.append("patient_city", payload.patient_city);
    if (payload.profile_photo) form.append("profile_photo", payload.profile_photo);
    if (payload.verification_document) {
      form.append("verification_document", payload.verification_document);
    }

    await httpClient.post("/user/complete-profile", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return null;
  },

  /** No server-side session to revoke — app users get a single long-lived
   *  access token with no refresh token, so "logout" is purely client-side
   *  (see `store/authStore.ts#logout`). */
  async logout(): Promise<void> {},
};

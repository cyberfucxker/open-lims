import { httpClient, resolveUploadUrl } from "./httpClient";
import { ApiRequestError } from "./ApiRequestError";
import type { AppApiResponseBody } from "@/types/common";
import type { ProfileResult } from "@/types";

/** Real replacement for `mocks/api/profileApi.ts` — matches `GET /user/profile`. */
async function fetchProfile(): Promise<ProfileResult> {
  const response = await httpClient.get<AppApiResponseBody<ProfileResult>>("/user/profile");
  const profile = response.data.data as ProfileResult;
  return {
    ...profile,
    profile_pic: resolveUploadUrl(profile.profile_pic),
    verification_document: resolveUploadUrl(profile.verification_document),
  };
}

export const profileApi = {
  getProfile: fetchProfile,

  /** There's no dedicated "patch name/email" endpoint — the only real
   *  profile-write route is `/user/complete-profile`, which requires
   *  `sex`/`d_o_b` on every call. So a quick name/email edit here re-sends
   *  the account's own already-set sex/d_o_b (fetched fresh, already in the
   *  `DD-MM-YYYY` shape the endpoint expects — no ISO conversion needed,
   *  unlike the onboarding flow in `authApi.ts`) alongside the patch. */
  async updateProfile(patch: Partial<{ name: string; email: string }>): Promise<null> {
    const current = await fetchProfile();
    if (!current.sex || !current.d_o_b) {
      throw new ApiRequestError(
        "Complete your profile (sex, date of birth) before editing it here.",
      );
    }

    const form = new FormData();
    form.append("name", patch.name ?? current.name ?? "");
    form.append("sex", current.sex);
    form.append("d_o_b", current.d_o_b);
    const email = patch.email ?? current.email;
    if (email) form.append("email", email);

    await httpClient.post("/user/complete-profile", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return null;
  },
};

import { delay } from "../delay";
import { mockDb } from "../state";
import type { ProfileResult } from "@/types";

export const profileApi = {
  async getProfile(): Promise<ProfileResult> {
    const age = mockDb.user.dob
      ? String(new Date().getFullYear() - new Date(mockDb.user.dob).getFullYear())
      : null;
    return delay({
      id: mockDb.user.id,
      name: mockDb.user.name,
      mobile: mockDb.user.mobile,
      email: mockDb.user.email,
      profile_pic: mockDb.user.profile_pic,
      verification_document: null,
      d_o_b: mockDb.user.dob,
      age,
      sex: mockDb.user.sex,
      is_profile_complete: mockDb.user.is_profile_complete,
      // Mock DB doesn't track a saved city yet — represented the same as a
      // real patient who hasn't picked one (see ProfileResult's doc-comment).
      city_id: null,
      city_name: null,
    });
  },

  async updateProfile(payload: Partial<{ name: string; email: string }>): Promise<null> {
    if (payload.name) mockDb.user.name = payload.name;
    if (payload.email) mockDb.user.email = payload.email;
    return delay(null);
  },
};

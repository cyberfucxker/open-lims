import { delay, newId } from "../delay";
import { mockDb } from "../state";
import type { AddFamilyMemberRequest, FamilyMemberResult, FamilyMembersResult } from "@/types";

export const familyApi = {
  async list(): Promise<FamilyMembersResult> {
    return delay({
      family_members: [...mockDb.familyMembers],
      city: [{ id: "city_jaipur", city: "Jaipur", slug: "jaipur" }],
    });
  },

  // Mirrors the real `services/api/familyApi.ts#add` — `mobile_no`/`dob` are
  // optional (an age-only entry falls back to a plain birth-year estimate,
  // same as the backend's `approximateDobFromAge`), and the created member
  // is returned so a caller could auto-select it, same contract either way.
  async add(payload: AddFamilyMemberRequest): Promise<FamilyMemberResult> {
    const member: FamilyMemberResult = {
      id: newId("fm"),
      name: payload.name,
      mobile_no: payload.mobile_no || mockDb.user.mobile,
      email: payload.email ?? null,
      dob: payload.dob ?? `01-01-${new Date().getFullYear() - (payload.age ?? 0)}`,
      age: payload.age ?? 0,
      relation: payload.relation,
      gender: payload.gender,
      upload_doc: null,
      user_id: mockDb.user.id,
    };
    mockDb.familyMembers.push(member);
    return delay(member);
  },

  async remove(memberId: string): Promise<null> {
    mockDb.familyMembers = mockDb.familyMembers.filter((m) => m.id !== memberId);
    return delay(null);
  },
};

import { httpClient, resolveUploadUrl } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type { AddFamilyMemberRequest, FamilyMemberResult, FamilyMembersResult } from "@/types";

/** The date input yields ISO (`YYYY-MM-DD`); the backend parses `dob` as
 *  `DD-MM-YYYY` (see its OpenAPI example) — same conversion as
 *  `authApi.ts#toBackendDob`. */
function toBackendDob(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
}

/** Real replacement for `mocks/api/familyApi.ts` — matches
 *  `GET /user/family-members`, `POST /user/add-family-member` (still sent as
 *  multipart so it keeps working through the backend's multer middleware,
 *  even though no file is attached anymore — ID verification was dropped),
 *  `DELETE /user/delete-family-member`. */
export const familyApi = {
  async list(): Promise<FamilyMembersResult> {
    const response =
      await httpClient.get<AppApiResponseBody<FamilyMembersResult>>("/user/family-members");
    const result = response.data.data as FamilyMembersResult;
    return {
      ...result,
      family_members: result.family_members.map((member) => ({
        ...member,
        upload_doc: resolveUploadUrl(member.upload_doc),
      })),
    };
  },

  async add(payload: AddFamilyMemberRequest): Promise<FamilyMemberResult> {
    const form = new FormData();
    form.append("name", payload.name);
    form.append("relation", payload.relation);
    form.append("gender", payload.gender);
    if (payload.mobile_no) form.append("mobile_no", payload.mobile_no);
    if (payload.dob) form.append("dob", toBackendDob(payload.dob));
    if (payload.age != null) form.append("age", String(payload.age));
    if (payload.email) form.append("email", payload.email);

    const response = await httpClient.post<AppApiResponseBody<FamilyMemberResult>>(
      "/user/add-family-member",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    const result = response.data.data as FamilyMemberResult;
    return { ...result, upload_doc: resolveUploadUrl(result.upload_doc) };
  },

  async remove(memberId: string): Promise<null> {
    await httpClient.delete("/user/delete-family-member", { data: { member_id: memberId } });
    return null;
  },
};

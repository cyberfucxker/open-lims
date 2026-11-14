import { httpClient, resolveUploadUrl } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type { PrescriptionItem, SubmitPrescriptionRequest } from "@/types";

/** Real replacement for `mocks/api/prescriptionApi.ts` — matches
 *  `GET /user/prescriptions`, `POST /user/prescriptions` (multipart),
 *  `DELETE /user/prescriptions/:id`. */
export const prescriptionApi = {
  async list(): Promise<PrescriptionItem[]> {
    const response =
      await httpClient.get<AppApiResponseBody<PrescriptionItem[]>>("/user/prescriptions");
    const items = response.data.data ?? [];
    return items.map((item) => ({ ...item, file_url: resolveUploadUrl(item.file_url) }));
  },

  async submit(payload: SubmitPrescriptionRequest): Promise<null> {
    const form = new FormData();
    form.append("family_member_id", payload.family_member_id);
    form.append("city_id", payload.city_id);
    if (payload.query) form.append("query", payload.query);
    form.append("prescription_file", payload.prescription_file);

    await httpClient.post("/user/prescriptions", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return null;
  },

  async remove(id: string): Promise<null> {
    await httpClient.delete(`/user/prescriptions/${id}`);
    return null;
  },
};

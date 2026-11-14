import { httpClient, resolveUploadUrl } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type { CenterDetail, CenterListItem } from "@/types";

/** Real replacement for `mocks/api/centerApi.ts` — matches
 *  `GET /user/centers` (optionally `?lat=&long=` for distance-sorted results)
 *  and `GET /user/center-details/:id`. */
export const centerApi = {
  async list(coords?: { lat: number; long: number }): Promise<CenterListItem[]> {
    const response = await httpClient.get<AppApiResponseBody<CenterListItem[]>>("/user/centers", {
      params: coords,
    });
    return response.data.data ?? [];
  },

  async getById(id: string): Promise<CenterDetail | null> {
    const response = await httpClient.get<AppApiResponseBody<CenterDetail>>(
      `/user/center-details/${id}`,
    );
    const detail = response.data.data;
    return detail ? { ...detail, center_image: resolveUploadUrl(detail.center_image) } : null;
  },
};

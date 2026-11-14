import { httpClient } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type { AddAddressRequest, AddressResult, Area, EditAddressRequest } from "@/types";

/** Real replacement for `mocks/api/addressApi.ts` — matches
 *  `GET /user/address-list`, `GET /user/areas`, `POST /user/add-address`,
 *  `PATCH /user/edit-address`, `DELETE /user/delete-address`,
 *  `POST /user/set-default-address`. */
export const addressApi = {
  async list(): Promise<AddressResult[]> {
    const response =
      await httpClient.get<AppApiResponseBody<AddressResult[]>>("/user/address-list");
    return response.data.data ?? [];
  },

  async areas(): Promise<Area[]> {
    const response = await httpClient.get<AppApiResponseBody<Area[]>>("/user/areas");
    return response.data.data ?? [];
  },

  async add(payload: AddAddressRequest): Promise<AddressResult> {
    const response = await httpClient.post<AppApiResponseBody<AddressResult>>(
      "/user/add-address",
      payload,
    );
    return response.data.data as AddressResult;
  },

  async edit(payload: EditAddressRequest): Promise<AddressResult> {
    const { id, ...rest } = payload;
    const response = await httpClient.patch<AppApiResponseBody<AddressResult>>(
      "/user/edit-address",
      {
        address_id: id,
        ...rest,
      },
    );
    return response.data.data as AddressResult;
  },

  async remove(id: string): Promise<null> {
    await httpClient.delete("/user/delete-address", { data: { address_id: id } });
    return null;
  },

  async setDefault(id: string): Promise<null> {
    await httpClient.post("/user/set-default-address", { address_id: id });
    return null;
  },
};

import { delay, newId } from "../delay";
import { MockApiError } from "../error";
import { MOCK_AREAS } from "../data/addresses";
import { mockDb } from "../state";
import type { AddAddressRequest, AddressResult, Area, EditAddressRequest } from "@/types";

export const addressApi = {
  async list(): Promise<AddressResult[]> {
    return delay([...mockDb.addresses]);
  },

  async areas(): Promise<Area[]> {
    return delay([...MOCK_AREAS]);
  },

  async add(payload: AddAddressRequest): Promise<AddressResult> {
    const created: AddressResult = {
      id: newId("addr"),
      user_id: mockDb.user.id,
      name: payload.name.toUpperCase() as AddressResult["name"],
      house_no: payload.house_no ?? null,
      block_no: payload.block_no ?? null,
      apartment: payload.apartment ?? null,
      address: payload.address,
      locality: payload.locality ?? null,
      landmark: payload.landmark ?? null,
      // Mirrors the real backend: everything here comes from the map, and a
      // pin the geocoder had nothing for saves as blank rather than failing.
      city: payload.city ?? "",
      state: payload.state ?? "",
      pincode: payload.pincode ?? "",
      phone: payload.phone ?? mockDb.user.mobile,
      lat: payload.lat ?? null,
      long: payload.long ?? null,
      is_default: payload.is_default === "1",
      area_id: payload.area_id ?? null,
    };
    if (created.is_default) {
      mockDb.addresses = mockDb.addresses.map((a) => ({ ...a, is_default: false }));
    }
    mockDb.addresses.push(created);
    return delay(created);
  },

  async edit(payload: EditAddressRequest): Promise<AddressResult> {
    const existing = mockDb.addresses.find((a) => a.id === payload.id);
    if (!existing) throw new MockApiError("Address not found.");
    const updated: AddressResult = {
      ...existing,
      ...payload,
      name: payload.name ? (payload.name.toUpperCase() as AddressResult["name"]) : existing.name,
      house_no: payload.house_no ?? existing.house_no,
      block_no: payload.block_no ?? existing.block_no,
      apartment: payload.apartment ?? existing.apartment,
      city: payload.city ?? existing.city,
      state: payload.state ?? existing.state,
      pincode: payload.pincode ?? existing.pincode,
      phone: payload.phone ?? existing.phone,
      locality: payload.locality ?? existing.locality,
      landmark: payload.landmark ?? existing.landmark,
      lat: payload.lat ?? existing.lat,
      long: payload.long ?? existing.long,
      area_id: payload.area_id ?? existing.area_id,
      is_default:
        payload.is_default !== undefined ? payload.is_default === "1" : existing.is_default,
    };
    mockDb.addresses = mockDb.addresses.map((a) => (a.id === payload.id ? updated : a));
    return delay(updated);
  },

  async remove(id: string): Promise<null> {
    mockDb.addresses = mockDb.addresses.filter((a) => a.id !== id);
    return delay(null);
  },

  async setDefault(id: string): Promise<null> {
    mockDb.addresses = mockDb.addresses.map((a) => ({ ...a, is_default: a.id === id }));
    return delay(null);
  },
};

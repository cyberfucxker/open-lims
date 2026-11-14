import type { Address, AddressType } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";

export interface AddressResult {
  id: string;
  user_id: string;
  name: AddressType;
  house_no: string | null;
  block_no: string | null;
  apartment: string | null;
  address: string;
  locality: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  lat: string | null;
  long: string | null;
  is_default: boolean;
  area_id: string | null;
}

function toResult(row: Address): AddressResult {
  return {
    id: row.id,
    user_id: row.appUserId,
    name: row.type,
    house_no: row.houseNo,
    block_no: row.blockNo,
    apartment: row.apartment,
    address: row.address,
    locality: row.locality,
    landmark: row.landmark,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    phone: row.phone,
    lat: row.latitude?.toString() ?? null,
    long: row.longitude?.toString() ?? null,
    is_default: row.isDefault,
    area_id: row.areaId,
  };
}

export async function listAddresses(appUserId: string): Promise<AddressResult[]> {
  const rows = await prisma.address.findMany({
    where: { appUserId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toResult);
}

export interface AddressInput {
  name: AddressType | "home" | "work" | "other";
  house_no?: string;
  block_no?: string;
  apartment?: string;
  address: string;
  locality?: string;
  landmark?: string;
  /** All three arrive from the map's reverse-geocode rather than from
   *  fields the patient fills, so all three are optional at the edge — see
   *  `normaliseCityState` for how the geocoded city/state is reconciled with
   *  this business's own City master before being stored. */
  city?: string;
  state?: string;
  pincode?: string;
  /** Optional — the app no longer forces a contact number on every address.
   *  Omitted/blank falls back to the account holder's own mobile (see
   *  `resolveAddressPhone`), so the column stays non-null and a
   *  phlebotomist always has someone to call. */
  phone?: string;
  lat?: string;
  long?: string;
  area_id?: string;
}

/** Nominatim hands back a raw OSM administrative name ("Jaipur Municipal
 *  Corporation", "Sanganer Tehsil", ...) that is essentially never an exact
 *  match for this business's own serviceable-city list — and that list is
 *  what every downstream lookup (area resolution, per-city pricing, slot
 *  templates) matches an address against. Fuzzy substring match, either
 *  direction, against the active City master; a hit stores the canonical
 *  city name and ITS state, so two patients pinning the same neighbourhood
 *  can never end up on two spellings of the same city. No hit keeps the
 *  geocoded text verbatim rather than blanking it: the address is still
 *  worth saving and still readable by a human, it simply won't resolve to a
 *  serviceable city — which is the truth about that pin.
 *
 *  This used to live in the patient web form. It moved here when the form
 *  dropped its City dropdown, so every client (web, Flutter) gets the same
 *  reconciliation instead of each re-implementing it. */
async function normaliseCityState(
  city: string | undefined,
  state: string | undefined,
): Promise<{ city: string; state: string }> {
  const rawCity = city?.trim() ?? "";
  const rawState = state?.trim() ?? "";
  if (!rawCity) return { city: "", state: rawState };

  const needle = rawCity.toLowerCase();
  const candidates = await prisma.city.findMany({
    where: { isActive: true },
    select: { name: true, state: { select: { name: true } } },
  });
  const matched = candidates.find((c) => {
    const name = c.name.toLowerCase();
    return needle.includes(name) || name.includes(needle);
  });

  return matched
    ? { city: matched.name, state: matched.state.name }
    : { city: rawCity, state: rawState };
}

/** Optional Area picker (Slot Template system) — validated to belong to
 *  the address's own city text so a patient can't accidentally attach an
 *  area from a different city. An address with no area simply stays
 *  areaId: null, which the Slot Availability engine treats as "service not
 *  available" once that city is cut over to the new system. */
async function resolveAreaId(areaId: string | undefined, city: string): Promise<string | null> {
  if (!areaId) return null;

  const area = await prisma.area.findUnique({ where: { id: areaId }, include: { city: true } });
  if (!area) {
    throw ApiError.badRequest("Selected area does not exist");
  }
  if (area.city.name.trim().toLowerCase() !== city.trim().toLowerCase()) {
    throw ApiError.badRequest("Selected area does not belong to the specified city");
  }
  return area.id;
}

/** Every address needs a reachable number — the collection visit depends on
 *  it — but making the patient re-type their own is friction, and they
 *  already proved that number by logging in with an OTP on it. So a blank
 *  `phone` resolves to the account holder's mobile rather than being stored
 *  empty; `Address.phone` stays NOT NULL and nothing downstream has to learn
 *  about a missing one.
 *
 *  `fallback` is the value to keep when editing an address that already had
 *  a phone: an edit that simply doesn't send the field shouldn't quietly
 *  replace a deliberately different number (a relative's, say) with the
 *  account's own. */
async function resolveAddressPhone(
  appUserId: string,
  phone: string | undefined,
  fallback?: string,
): Promise<string> {
  const trimmed = phone?.trim();
  if (trimmed) return trimmed;
  if (fallback) return fallback;

  const appUser = await prisma.appUser.findUnique({
    where: { id: appUserId },
    select: { mobile: true },
  });
  return appUser?.mobile ?? "";
}

export async function addAddress(
  appUserId: string,
  input: AddressInput,
  isDefaultInput: boolean,
): Promise<AddressResult> {
  const existingCount = await prisma.address.count({ where: { appUserId } });
  const isDefault = isDefaultInput || existingCount === 0;
  const { city, state } = await normaliseCityState(input.city, input.state);
  const areaId = await resolveAreaId(input.area_id, city);
  const phone = await resolveAddressPhone(appUserId, input.phone);

  const created = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({
        where: { appUserId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        appUserId,
        type: input.name.toUpperCase() as AddressType,
        houseNo: input.house_no || null,
        blockNo: input.block_no || null,
        apartment: input.apartment || null,
        address: input.address,
        locality: input.locality || null,
        landmark: input.landmark || null,
        city,
        state,
        pincode: input.pincode || "",
        phone,
        latitude: input.lat || null,
        longitude: input.long || null,
        isDefault,
        areaId,
      },
    });
  });

  return toResult(created);
}

async function requireOwnedAddress(appUserId: string, addressId: string): Promise<Address> {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.appUserId !== appUserId) {
    throw ApiError.notFound("Address not found");
  }
  return address;
}

/** Deliberately excludes `is_default` from the update set — matches
 *  api.md's documented asymmetry vs Add Address; use Set Default instead. */
export async function editAddress(
  appUserId: string,
  addressId: string,
  input: AddressInput,
): Promise<AddressResult> {
  const existing = await requireOwnedAddress(appUserId, addressId);
  // A client that hasn't added the Area picker yet won't send `area_id` at
  // all — preserve whatever area was already set rather than silently
  // wiping it on every edit.
  // Same reasoning as `areaId` just below: a client that omits a field
  // shouldn't have it silently wiped. Locality, city, state, pincode and the
  // coordinates now all come from the map pin, and the Edit Address form
  // only resends them when the patient actually re-pins — an edit that just
  // corrects a flat number leaves them out entirely, and must keep what the
  // address already had rather than blanking the whole location.
  const geocoded = await normaliseCityState(input.city, input.state);
  const city = geocoded.city || existing.city;
  const state = geocoded.state || existing.state;
  const pincode = input.pincode?.trim() || existing.pincode;
  const locality = input.locality?.trim() || existing.locality;
  const latitude = input.lat || existing.latitude;
  const longitude = input.long || existing.longitude;
  const areaId =
    input.area_id !== undefined ? await resolveAreaId(input.area_id, city) : existing.areaId;
  const phone = await resolveAddressPhone(appUserId, input.phone, existing.phone);

  const updated = await prisma.address.update({
    where: { id: addressId },
    data: {
      type: input.name.toUpperCase() as AddressType,
      houseNo: input.house_no || null,
      blockNo: input.block_no || null,
      apartment: input.apartment || null,
      address: input.address,
      locality,
      landmark: input.landmark || null,
      city,
      state,
      pincode,
      phone,
      latitude,
      longitude,
      areaId,
    },
  });

  return toResult(updated);
}

export async function deleteAddress(appUserId: string, addressId: string): Promise<void> {
  await requireOwnedAddress(appUserId, addressId);

  const activeOrder = await prisma.appOrder.findFirst({
    where: { addressId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
  });
  if (activeOrder) {
    throw ApiError.conflict("This address is in use by an active order and cannot be deleted");
  }

  await prisma.address.delete({ where: { id: addressId } });
}

/** Backs the Area picker in the Add/Edit Address flow — lists areas for a
 *  city, falling back to the caller's own profile city (`AppUser.cityId`,
 *  already resolved at Complete Profile time) if none is given. Mirrors
 *  `familyMemberService.listFamilyMembersWithCities()`'s existing
 *  `{id, city, slug}` cities list — same "expose City/Area data to the app"
 *  precedent, just one level down. */
export async function listAreasForCity(
  appUserId: string,
  cityId?: string,
): Promise<Array<{ id: string; name: string }>> {
  let resolvedCityId = cityId;
  if (!resolvedCityId) {
    const appUser = await prisma.appUser.findUnique({
      where: { id: appUserId },
      select: { cityId: true },
    });
    resolvedCityId = appUser?.cityId ?? undefined;
  }
  if (!resolvedCityId) return [];

  const areas = await prisma.area.findMany({
    where: { cityId: resolvedCityId, isActive: true },
    orderBy: { name: "asc" },
  });
  return areas.map((a) => ({ id: a.id, name: a.name }));
}

export async function setDefaultAddress(appUserId: string, addressId: string): Promise<void> {
  await requireOwnedAddress(appUserId, addressId);

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { appUserId, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.address.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);
}

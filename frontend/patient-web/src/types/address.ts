export type AddressTypeResponse = "HOME" | "WORK" | "OTHER";
export type AddressTypeRequest = "home" | "work" | "other";

export interface AddressResult {
  id: string;
  user_id: string;
  name: AddressTypeResponse;
  house_no: string | null;
  /** Building / block within a complex ("Block C", "Tower 4") — the Add
   *  Address form's second typed field, distinct from `apartment` (the
   *  society name). */
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

export interface AddAddressRequest {
  name: AddressTypeRequest;
  house_no?: string;
  block_no?: string;
  apartment?: string;
  /** Everything from here down to `long` comes from the map pin's
   *  reverse-geocode, not from anything the patient types — the form has no
   *  city/state/pincode fields any more. All optional at the API edge so a
   *  pin in a spot OSM has no postcode for still saves; the backend
   *  fuzzy-matches `city` against the serviceable City master. */
  address: string;
  locality?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  lat?: string;
  long?: string;
  area_id?: string;
  is_default?: "0" | "1";
}

export type EditAddressRequest = Partial<AddAddressRequest> & { id: string };

export interface Area {
  id: string;
  name: string;
}

import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

export type OrganizationType = "GENERAL_CENTER" | "COLLECTION_CENTER";
/** Whose branding goes on this franchise's reports and invoices. Orthogonal to
 *  `OrganizationType` above, which is what the center does. */
export type FranchiseType = "SINGLE_LAB" | "CO_LAB";
export type OrgPaymentType = "PREPAID" | "POSTPAID";
export type DeliveryChannel = "WHATSAPP" | "EMAIL" | "SMS";
export const ORGANIZATION_MODULES = ["patients", "samples", "reports", "invoices"] as const;
export type OrganizationModule = (typeof ORGANIZATION_MODULES)[number];

export interface OrganizationLoginInfo {
  userId: string;
  username: string;
  isActive: boolean;
  roleId: string;
  roleName: string;
}

export interface Organization {
  id: string;
  code: string;
  name: string;
  type: OrganizationType;
  contactPerson: string | null;
  mobile: string;
  email: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  cityId: string | null;
  cityName: string | null;
  pincode: string | null;
  address: string | null;
  description: string | null;

  franchiseType: FranchiseType;
  labName: string | null;
  labLogoPath: string | null;

  priceListId: string | null;
  priceListName: string | null;
  paymentType: OrgPaymentType;
  creditLimit: number;
  advanceAmount: number;
  dueDays: number;
  source: string | null;
  billingRules: string | null;
  invoiceRules: string | null;
  reportDeliveryChannels: DeliveryChannel[];
  billDeliveryChannels: DeliveryChannel[];

  loginEnabled: boolean;
  enabledModules: OrganizationModule[];
  login: OrganizationLoginInfo | null;

  commissionPct: number;
  orderCount: number;
  settlementDue: number;

  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListOrganizationsParams {
  search?: string;
  type?: OrganizationType;
  franchiseType?: FranchiseType;
  active?: "true" | "false" | "all";
  priceListId?: string;
  /** Franchises assigned to this city only — powers the "Parent Franchise"
   *  picker in the Slot Management "City Config" tab. */
  cityId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListOrganizationsResult {
  rows: Organization[];
  total: number;
  totalOrderVolume: number;
  totalSettlementDue: number;
}

export async function fetchOrganizations(
  params: ListOrganizationsParams = {},
): Promise<ListOrganizationsResult> {
  const response = await httpClient.get<ApiResponseBody<ListOrganizationsResult>>(
    "/organizations",
    { params, suppressErrorToast: true },
  );
  return response.data.data as ListOrganizationsResult;
}

export async function fetchOrganization(id: string): Promise<Organization> {
  const response = await httpClient.get<ApiResponseBody<Organization>>(`/organizations/${id}`, {
    suppressErrorToast: true,
  });
  return response.data.data as Organization;
}

export interface OrganizationFormValues {
  name: string;
  /** Omitted by the franchise form — the backend defaults it to
   *  COLLECTION_CENTER. Still sent by flows that genuinely choose. */
  type?: OrganizationType;
  contactPerson?: string | null;
  mobile: string;
  email?: string | null;
  city?: string | null;
  cityId?: string | null;
  franchiseType?: FranchiseType;
  labName?: string | null;
  labLogoPath?: string | null;
  priceListId?: string | null;
  commissionPct?: number;
  /** Supplying both provisions the franchise's portal login in the same
   *  transaction as the organization. Omit both for no portal access. */
  username?: string;
  password?: string;
}

export async function createOrganizationApi(values: OrganizationFormValues): Promise<Organization> {
  const response = await httpClient.post<ApiResponseBody<Organization>>("/organizations", values, {
    suppressErrorToast: true,
  });
  return response.data.data as Organization;
}

export async function updateOrganizationApi(
  id: string,
  values: Partial<OrganizationFormValues>,
): Promise<Organization> {
  const response = await httpClient.put<ApiResponseBody<Organization>>(
    `/organizations/${id}`,
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as Organization;
}

export async function deleteOrganizationApi(id: string): Promise<void> {
  await httpClient.delete(`/organizations/${id}`, { suppressErrorToast: true });
}

export async function setOrganizationStatusApi(id: string, active: boolean): Promise<Organization> {
  const response = await httpClient.patch<ApiResponseBody<Organization>>(
    `/organizations/${id}/status`,
    { active },
    { suppressErrorToast: true },
  );
  return response.data.data as Organization;
}

export interface EnableOrganizationLoginInput {
  username: string;
  password: string;
  roleId: string;
  enabledModules: OrganizationModule[];
}

export async function enableOrganizationLoginApi(
  id: string,
  input: EnableOrganizationLoginInput,
): Promise<Organization> {
  const response = await httpClient.post<ApiResponseBody<Organization>>(
    `/organizations/${id}/login`,
    input,
    { suppressErrorToast: true },
  );
  return response.data.data as Organization;
}

export async function updateOrganizationLoginApi(
  id: string,
  input: { isActive?: boolean; password?: string },
): Promise<Organization> {
  const response = await httpClient.patch<ApiResponseBody<Organization>>(
    `/organizations/${id}/login`,
    input,
    { suppressErrorToast: true },
  );
  return response.data.data as Organization;
}

export async function disableOrganizationLoginApi(id: string): Promise<Organization> {
  const response = await httpClient.delete<ApiResponseBody<Organization>>(
    `/organizations/${id}/login`,
    { suppressErrorToast: true },
  );
  return response.data.data as Organization;
}

// --- Small page-local lookup helpers (price lists + the FRANCHISE role id) ---
// Owned locally by the Organizations module only, same convention as
// appOrderApi.ts's minimal customer-lookup helpers.

export interface PriceListOption {
  id: string;
  name: string;
}

export interface CityOption {
  id: string;
  name: string;
  stateName: string;
}

/** Cities for the franchise form's dropdown. Reuses the slot module's city
 *  listing rather than adding a second endpoint — it is already the canonical
 *  admin-facing list of `app_cities`, and the extra slot fields are ignored. */
export async function fetchCityOptions(): Promise<CityOption[]> {
  const response = await httpClient.get<ApiResponseBody<CityOption[]>>("/city-slot-config/cities", {
    suppressErrorToast: true,
  });
  return response.data.data ?? [];
}

/** Assignable price lists ONLY — `ownership: "template"` excludes the private
 *  clones each franchise owns. Offering a clone here would be a dead end: the
 *  API rejects assigning one franchise's list to another. */
export async function fetchPriceListOptions(): Promise<PriceListOption[]> {
  const response = await httpClient.get<
    ApiResponseBody<{ rows: PriceListOption[]; total: number }>
  >("/price-lists", {
    params: { active: "true", ownership: "template", pageSize: 100 },
    suppressErrorToast: true,
  });
  return (response.data.data as { rows: PriceListOption[] }).rows;
}

/** Org portal logins only ever use the FRANCHISE role — looked up by name
 *  rather than hardcoding an id, since ids differ per environment/seed. */
export async function fetchFranchiseRoleId(): Promise<string | null> {
  const response = await httpClient.get<ApiResponseBody<{ id: string; name: string }[]>>("/roles", {
    suppressErrorToast: true,
  });
  const roles = response.data.data ?? [];
  return roles.find((r) => r.name === "FRANCHISE")?.id ?? null;
}

// --- Service areas -----------------------------------------------------
//
// Which Area(s) this franchise is assigned to cover — distinct from `cityId`
// above. A patient-web/app order never names a franchise; it's the order's
// resolved Area matching one of these that routes it into this franchise's
// orders list (see `franchiseOrderScope.ts` on the backend).

export interface OrganizationServiceArea {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
}

export async function fetchOrganizationServiceAreas(
  organizationId: string,
): Promise<OrganizationServiceArea[]> {
  const response = await httpClient.get<ApiResponseBody<OrganizationServiceArea[]>>(
    `/organizations/${organizationId}/service-areas`,
    { suppressErrorToast: true },
  );
  return response.data.data ?? [];
}

export async function setOrganizationServiceAreasApi(
  organizationId: string,
  areaIds: string[],
): Promise<OrganizationServiceArea[]> {
  const response = await httpClient.put<ApiResponseBody<OrganizationServiceArea[]>>(
    `/organizations/${organizationId}/service-areas`,
    { areaIds },
    { suppressErrorToast: true },
  );
  return response.data.data ?? [];
}

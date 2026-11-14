import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

export interface ServiceCenter {
  id: string;
  name: string;
}

/** Unpaginated — just for populating the optional center dropdown (Slot Management). */
export async function fetchServiceCenters(): Promise<ServiceCenter[]> {
  const response = await httpClient.get<ApiResponseBody<ServiceCenter[]>>(
    "/service-centers/options",
    { suppressErrorToast: true },
  );
  return response.data.data as ServiceCenter[];
}

/** Mirrors the backend's `ServiceCenterDto` (GET /service-centers, GET /service-centers/:id) —
 *  a diagnostic center/lab shown to patients as a "nearest lab". */
/** The only two center types — stored as the code, shown as the label. */
export const CENTER_TYPES = [
  { value: "COLLECTION_CENTER", label: "Collection Center" },
  { value: "LAB", label: "Lab" },
] as const;

export type CenterTypeCode = (typeof CENTER_TYPES)[number]["value"];

export function centerTypeLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return CENTER_TYPES.find((t) => t.value === value)?.label ?? value;
}

/** Older rows hold free text ("Collection Centre", "LABORATORY") from before
 *  the field was a dropdown — map them onto a code so editing shows a choice. */
export function toCenterTypeCode(value: string | null | undefined): CenterTypeCode {
  return value && /lab/i.test(value) && !/collection/i.test(value) ? "LAB" : "COLLECTION_CENTER";
}

export interface DiagnosticCenter {
  id: string;
  name: string;
  imageUrl: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  openingTime: string | null;
  closingTime: string | null;
  centerType: string | null;
  isActive: boolean;
  facilities: string[];
  paymentMethods: string[];
  photos: string[];
  /** The franchise this lab card is assigned to — null if none. Set here so
   *  a patient's "Book Now" on this card routes their booking to that
   *  franchise's dashboard (see backend's `franchiseOrderScope`). */
  organizationId: string | null;
  organizationName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosticCenterListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface DiagnosticCenterFormValues {
  name: string;
  imageUrl?: string | null;
  address: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  latitude: number;
  longitude: number;
  /** 0–5, one decimal. Admin-entered: there is no patient review table to
   *  average from, so whatever the CMS saves here is exactly what the patient
   *  app's nearest-lab card shows. */
  rating?: number;
  /** The count rendered beside `rating` — admin-entered for the same reason. */
  reviewCount?: number;
  openingTime?: string | null;
  closingTime?: string | null;
  centerType?: string | null;
  isActive?: boolean;
  facilities?: string[];
  paymentMethods?: string[];
  photos?: string[];
  /** Assign this lab card to a franchise, or `null` to clear it. */
  organizationId?: string | null;
}

export async function fetchCenters(
  params: DiagnosticCenterListParams = {},
): Promise<PaginatedResult<DiagnosticCenter>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<DiagnosticCenter>>>(
    "/service-centers",
    { params, suppressErrorToast: true },
  );
  return response.data.data as PaginatedResult<DiagnosticCenter>;
}

export async function createCenterApi(
  values: DiagnosticCenterFormValues,
): Promise<DiagnosticCenter> {
  const response = await httpClient.post<ApiResponseBody<DiagnosticCenter>>(
    "/service-centers",
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as DiagnosticCenter;
}

export async function updateCenterApi(
  id: string,
  values: DiagnosticCenterFormValues,
): Promise<DiagnosticCenter> {
  const response = await httpClient.put<ApiResponseBody<DiagnosticCenter>>(
    `/service-centers/${id}`,
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as DiagnosticCenter;
}

export async function setCenterStatusApi(id: string, isActive: boolean): Promise<DiagnosticCenter> {
  const response = await httpClient.patch<ApiResponseBody<DiagnosticCenter>>(
    `/service-centers/${id}/status`,
    { isActive },
    { suppressErrorToast: true },
  );
  return response.data.data as DiagnosticCenter;
}

export async function deleteCenterApi(id: string): Promise<void> {
  await httpClient.delete(`/service-centers/${id}`, { suppressErrorToast: true });
}

import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

/** Real backend order lifecycle — no client-only statuses like the old mock's
 *  "phlebo_assigned"/"processing"/"delivered". ACCEPTED/STARTED_JOURNEY/SAMPLE_DROPPED/
 *  REJECTED are driven by the Phlebo App's own booking workflow. */
export type AppOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ACCEPTED"
  | "STARTED_JOURNEY"
  | "REACHED"
  | "SAMPLE_COLLECTED"
  | "SAMPLE_DROPPED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export type AppOrderPaymentMode = "CASH" | "ONLINE";
export type AppOrderPaymentStatus = "PAID" | "PARTIAL" | "PENDING" | null;

/** CATALOG = every pre-existing order (tests/packages picked at checkout).
 *  HOME_VISIT = booked with a symptom instead — `items` is empty until the
 *  assigned phlebotomist (or, here, an admin) adds tests via
 *  `addHomeVisitItemsApi`, which is what first creates its Appointment/Bill. */
export type AppOrderType = "CATALOG" | "HOME_VISIT";

export interface AppOrderPhlebo {
  id: string;
  name: string;
}

/** Row shape from `GET /app-orders`. `platform` is the device that confirmed
 * the booking (backend-captured from the Flutter app's `platform` header at
 * Confirm Order time) — "WEB" covers pre-migration orders and genuine web
 * checkouts, it is never fabricated client-side. */
export interface AppOrderListItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  city: string;
  itemSummary: string;
  phlebotomist: AppOrderPhlebo | null;
  slotLabel: string | null;
  platform: "ANDROID" | "IOS" | "WEB" | "WHATSAPP";
  orderType: AppOrderType;
  status: AppOrderStatus;
  totalPayable: number;
  paymentMode: AppOrderPaymentMode;
  paymentStatus: AppOrderPaymentStatus;
  orderDate: string;
  createdAt: string;
}

export interface AppOrderListParams {
  search?: string;
  status?: AppOrderStatus | "all";
  /** Also accepts the literal string "unassigned" per the documented convention. */
  phleboId?: string;
  paymentMode?: AppOrderPaymentMode | "all";
  paymentStatus?: NonNullable<AppOrderPaymentStatus> | "all";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface AppOrderAddress {
  id: string;
  type: string;
  houseNo: string | null;
  apartment: string | null;
  address: string;
  locality: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  // The live response also includes these but AGENT_NOTES.md's contract doesn't document them —
  // kept optional so we render safely either way.
  phone?: string;
  latitude?: number;
  longitude?: number;
}

export interface AppOrderSlot {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
}

export interface AppOrderDetailPhlebo {
  id: string;
  name: string;
  mobile: string;
  photoUrl: string | null;
}

export interface AppOrderCustomer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
}

export interface AppOrderItem {
  id: string;
  name: string;
  price: number;
  /** Whose sample this line is for. `customer` is who booked the order —
   *  one order can cover several family members, so ops reads this per item. */
  familyMemberId: string;
  patientName: string;
  relation: string;
}

/** Everyone the order collects from, de-duplicated — one Appointment each. */
export interface AppOrderPatient {
  familyMemberId: string;
  name: string;
  relation: string;
  age: number;
  gender: string;
  mobile: string;
}

export interface AppOrderTimelineStep {
  label: string;
  at: string;
}

/** Full detail shape from `GET /app-orders/:id`. `timeline` is NOT guaranteed sorted by the
 * API — sort by `at` ascending client-side before rendering (see AGENT_NOTES.md). */
export interface AppOrderDetail {
  id: string;
  orderNumber: string;
  customer: AppOrderCustomer;
  address: AppOrderAddress | null;
  slot: AppOrderSlot | null;
  phlebotomist: AppOrderDetailPhlebo | null;
  status: AppOrderStatus;
  orderType: AppOrderType;
  /** Only set on a HOME_VISIT order — the complaint captured at booking, for
   *  whoever adds tests to read before picking them. */
  symptomNotes: string | null;
  /** Only set on a HOME_VISIT order, and only until `items` is populated. */
  homeVisitFamilyMember: { familyMemberId: string; name: string; relation: string } | null;
  paymentMode: AppOrderPaymentMode;
  paymentStatus: AppOrderPaymentStatus;
  servicePin: string;
  patients: AppOrderPatient[];
  subtotal: number;
  phlebotomyCharges: number;
  walletDiscount: number;
  couponDiscount: number;
  totalPayable: number;
  items: AppOrderItem[];
  timeline: AppOrderTimelineStep[];
  createdAt: string;
}

export interface CreateAppOrderBody {
  appUserId: string;
  familyMemberId?: string;
  addressId: string;
  slotId?: string;
  orderDate: string;
  testIds: string[];
  packageIds?: string[];
  paymentMode: AppOrderPaymentMode;
}

export async function fetchAppOrders(
  params: AppOrderListParams = {},
): Promise<PaginatedResult<AppOrderListItem>> {
  const { status, paymentMode, paymentStatus, ...rest } = params;
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<AppOrderListItem>>>(
    "/app-orders",
    {
      params: {
        ...rest,
        status: status && status !== "all" ? status : undefined,
        paymentMode: paymentMode && paymentMode !== "all" ? paymentMode : undefined,
        paymentStatus: paymentStatus && paymentStatus !== "all" ? paymentStatus : undefined,
      },
      suppressErrorToast: true,
    },
  );
  return response.data.data as PaginatedResult<AppOrderListItem>;
}

export async function fetchAppOrder(id: string): Promise<AppOrderDetail> {
  const response = await httpClient.get<ApiResponseBody<AppOrderDetail>>(`/app-orders/${id}`, {
    suppressErrorToast: true,
  });
  return response.data.data as AppOrderDetail;
}

export async function updateAppOrderStatusApi(
  id: string,
  status: AppOrderStatus,
): Promise<AppOrderDetail> {
  const response = await httpClient.patch<ApiResponseBody<AppOrderDetail>>(
    `/app-orders/${id}/status`,
    { status },
    { suppressErrorToast: true },
  );
  return response.data.data as AppOrderDetail;
}

export async function assignPhleboApi(
  id: string,
  phleboId: string | null,
): Promise<AppOrderDetail> {
  const response = await httpClient.patch<ApiResponseBody<AppOrderDetail>>(
    `/app-orders/${id}/assign-phlebo`,
    { phleboId },
    { suppressErrorToast: true },
  );
  return response.data.data as AppOrderDetail;
}

export async function createAppOrderApi(body: CreateAppOrderBody): Promise<AppOrderDetail> {
  const response = await httpClient.post<ApiResponseBody<AppOrderDetail>>("/app-orders", body, {
    suppressErrorToast: true,
  });
  return response.data.data as AppOrderDetail;
}

export async function deleteAppOrderApi(id: string): Promise<void> {
  await httpClient.delete(`/app-orders/${id}`, { suppressErrorToast: true });
}

export interface AddHomeVisitItemsBody {
  testIds: string[];
  packageIds?: string[];
}

/** Lets an admin pick (or add to) the tests on a home-visit booking, same
 *  action the phlebo app's own "add tests" screen calls — callable
 *  repeatedly, growing the order rather than being a one-shot. Only legal on
 *  a HOME_VISIT order while the visit is accepted/on the way/reached (see
 *  backend's `addHomeVisitItems`). */
export async function addHomeVisitItemsApi(
  id: string,
  body: AddHomeVisitItemsBody,
): Promise<AppOrderDetail> {
  const response = await httpClient.post<ApiResponseBody<AppOrderDetail>>(
    `/app-orders/${id}/home-visit-items`,
    body,
    { suppressErrorToast: true },
  );
  return response.data.data as AppOrderDetail;
}

/** Mirror of the above — drops one test/package line (by its `AppOrderItem`
 *  id, i.e. `AppOrderDetail.items[number].id`) and re-bills from whatever's
 *  left (see backend's `removeHomeVisitItem`). */
export async function removeHomeVisitItemApi(id: string, itemId: string): Promise<AppOrderDetail> {
  const response = await httpClient.delete<ApiResponseBody<AppOrderDetail>>(
    `/app-orders/${id}/home-visit-items/${itemId}`,
    { suppressErrorToast: true },
  );
  return response.data.data as AppOrderDetail;
}

// --- Minimal customer-lookup helpers, owned locally by the Orders module only ---
// (Deliberately NOT imported from/into src/pages/customers/** — see AGENT_NOTES.md hard
// boundary. Another agent may be building a fuller appUserApi.ts in parallel; this is just
// enough to power the create-order customer picker.)

export interface AppUserSearchResult {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  cityName: string | null;
}

export async function searchAppUsersForOrder(search: string): Promise<AppUserSearchResult[]> {
  if (!search.trim()) return [];
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<AppUserSearchResult>>>(
    "/app-users",
    { params: { search, page: 1, pageSize: 10 }, suppressErrorToast: true },
  );
  return (response.data.data as PaginatedResult<AppUserSearchResult>).rows;
}

export interface AppUserAddress {
  id: string;
  type: string;
  houseNo: string | null;
  apartment: string | null;
  address: string;
  locality: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface AppUserDetailForOrder {
  profile: { id: string; name: string; mobile: string };
  addresses: AppUserAddress[];
}

export async function fetchAppUserForOrder(id: string): Promise<AppUserDetailForOrder> {
  const response = await httpClient.get<ApiResponseBody<AppUserDetailForOrder>>(
    `/app-users/${id}`,
    { suppressErrorToast: true },
  );
  return response.data.data as AppUserDetailForOrder;
}

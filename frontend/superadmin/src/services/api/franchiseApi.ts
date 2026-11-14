import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { FranchiseType } from "@/services/api/organizationApi";
import type { AppOrderDetail, AppOrderStatus } from "@/services/api/appOrderApi";
import type { PhlebotomistDto } from "@/services/api/phlebotomistApi";

/**
 * The franchise portal's API surface — every endpoint is implicitly scoped to
 * the logged-in franchise server-side. Note that nothing here takes an
 * organization id: there is no parameter through which one franchise could ask
 * for another's data.
 */

export type FranchisePeriod = "today" | "week" | "month" | "all";
export type PriceListItemType = "TEST" | "PACKAGE" | "PARAMETER";

// --- Profile ---------------------------------------------------------------

export interface FranchiseProfile {
  id: string;
  code: string;
  name: string;
  ownerName: string | null;
  mobile: string;
  email: string | null;
  cityName: string | null;
  franchiseType: FranchiseType;
  labName: string | null;
  labLogoPath: string | null;
  priceListName: string | null;
  username: string | null;
  commissionPct: number;
  createdAt: string;
}

export interface FranchiseProfileUpdate {
  ownerName?: string | null;
  mobile?: string;
  email?: string | null;
  labName?: string | null;
}

export async function fetchFranchiseProfile(): Promise<FranchiseProfile> {
  const response = await httpClient.get<ApiResponseBody<FranchiseProfile>>("/franchise/me", {
    suppressErrorToast: true,
  });
  return response.data.data as FranchiseProfile;
}

export async function updateFranchiseProfile(
  values: FranchiseProfileUpdate,
): Promise<FranchiseProfile> {
  const response = await httpClient.patch<ApiResponseBody<FranchiseProfile>>(
    "/franchise/me",
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as FranchiseProfile;
}

export async function uploadFranchiseLogo(file: File): Promise<FranchiseProfile> {
  const form = new FormData();
  form.append("file", file);
  const response = await httpClient.post<ApiResponseBody<FranchiseProfile>>(
    "/franchise/me/logo",
    form,
    { suppressErrorToast: true },
  );
  return response.data.data as FranchiseProfile;
}

// --- Dashboard -------------------------------------------------------------

export interface FranchiseDashboardStats {
  todayOrders: number;
  totalOrders: number;
  periodOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalEarnings: number;
  pendingReports: number;
}

export interface FranchiseTopItem {
  id: string;
  name: string;
  orderCount: number;
  revenue: number;
}

export interface FranchiseRecentOrder {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerMobile: string;
  itemSummary: string;
  status: string;
  totalPayable: number;
  createdAt: string;
}

export interface FranchiseDashboard {
  stats: FranchiseDashboardStats;
  revenueTrend: { date: string; revenue: number }[];
  topTests: FranchiseTopItem[];
  topPackages: FranchiseTopItem[];
  recentOrders: FranchiseRecentOrder[];
}

export async function fetchFranchiseDashboard(
  period: FranchisePeriod,
): Promise<FranchiseDashboard> {
  const response = await httpClient.get<ApiResponseBody<FranchiseDashboard>>(
    "/franchise/dashboard",
    { params: { period }, suppressErrorToast: true },
  );
  return response.data.data as FranchiseDashboard;
}

// --- Orders ----------------------------------------------------------------

export interface FranchiseOrderRow {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerMobile: string;
  city: string | null;
  itemSummary: string;
  status: string;
  totalPayable: number;
  paymentMode: string | null;
  paymentStatus: string | null;
  orderDate: string;
  createdAt: string;
}

export interface ListFranchiseOrdersParams {
  search?: string;
  status?: string;
  paymentStatus?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchFranchiseOrders(
  params: ListFranchiseOrdersParams,
): Promise<{ rows: FranchiseOrderRow[]; total: number }> {
  const response = await httpClient.get<
    ApiResponseBody<{ rows: FranchiseOrderRow[]; total: number }>
  >("/franchise/orders", { params, suppressErrorToast: true });
  return response.data.data as { rows: FranchiseOrderRow[]; total: number };
}

/** Full detail — same `AppOrderDetail` shape the Superadmin Order Management
 *  drawer renders, since both endpoints call the same backend mapper. */
export async function fetchFranchiseOrder(id: string): Promise<AppOrderDetail> {
  const response = await httpClient.get<ApiResponseBody<AppOrderDetail>>(
    `/franchise/orders/${id}`,
    { suppressErrorToast: true },
  );
  return response.data.data as AppOrderDetail;
}

export async function updateFranchiseOrderStatus(
  id: string,
  status: AppOrderStatus,
): Promise<AppOrderDetail> {
  const response = await httpClient.patch<ApiResponseBody<AppOrderDetail>>(
    `/franchise/orders/${id}/status`,
    { status },
    { suppressErrorToast: true },
  );
  return response.data.data as AppOrderDetail;
}

export async function assignFranchiseOrderPhlebo(
  id: string,
  phleboId: string | null,
): Promise<AppOrderDetail> {
  const response = await httpClient.patch<ApiResponseBody<AppOrderDetail>>(
    `/franchise/orders/${id}/assign-phlebo`,
    { phleboId },
    { suppressErrorToast: true },
  );
  return response.data.data as AppOrderDetail;
}

export interface AddFranchiseHomeVisitItemsBody {
  testIds: string[];
  packageIds?: string[];
}

export async function addFranchiseHomeVisitItems(
  id: string,
  body: AddFranchiseHomeVisitItemsBody,
): Promise<AppOrderDetail> {
  const response = await httpClient.post<ApiResponseBody<AppOrderDetail>>(
    `/franchise/orders/${id}/home-visit-items`,
    body,
    { suppressErrorToast: true },
  );
  return response.data.data as AppOrderDetail;
}

export async function removeFranchiseHomeVisitItem(
  id: string,
  itemId: string,
): Promise<AppOrderDetail> {
  const response = await httpClient.delete<ApiResponseBody<AppOrderDetail>>(
    `/franchise/orders/${id}/home-visit-items/${itemId}`,
    { suppressErrorToast: true },
  );
  return response.data.data as AppOrderDetail;
}

/** A walk-in patient with no app account yet — created alongside the order
 *  (`AppUser` + a `SELF` family member + one address), rather than requiring
 *  the franchise to provision an account some other way first. */
export interface CreateFranchiseOrderNewCustomer {
  name: string;
  mobile: string;
  gender: "Male" | "Female" | "Other";
  dob?: string;
  age?: number;
  email?: string;
  address: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    areaId?: string;
    phone?: string;
  };
}

export interface CreateFranchiseOrderBody {
  newCustomer: CreateFranchiseOrderNewCustomer;
  orderDate: string;
  testIds: string[];
  packageIds?: string[];
  paymentMode: "CASH" | "ONLINE";
}

export async function createFranchiseOrder(
  body: CreateFranchiseOrderBody,
): Promise<AppOrderDetail> {
  const response = await httpClient.post<ApiResponseBody<AppOrderDetail>>(
    "/franchise/orders",
    body,
    { suppressErrorToast: true },
  );
  return response.data.data as AppOrderDetail;
}

// --- Phlebotomists -----------------------------------------------------
//
// A franchise's own only — see `Phlebotomist.createdByOrganizationId`'s
// doc-comment on the backend. Scoped to the franchise's own service areas.

export async function fetchFranchisePhlebos(): Promise<PhlebotomistDto[]> {
  const response = await httpClient.get<ApiResponseBody<PhlebotomistDto[]>>("/franchise/phlebos", {
    suppressErrorToast: true,
  });
  return response.data.data ?? [];
}

export interface CreateFranchisePhleboBody {
  name: string;
  mobile: string;
  photoUrl?: string | null;
  workingHoursStart?: string | null;
  workingHoursEnd?: string | null;
  serviceAreaIds: string[];
}

export async function createFranchisePhlebo(
  body: CreateFranchisePhleboBody,
): Promise<PhlebotomistDto> {
  const response = await httpClient.post<ApiResponseBody<PhlebotomistDto>>(
    "/franchise/phlebos",
    body,
    { suppressErrorToast: true },
  );
  return response.data.data as PhlebotomistDto;
}

export async function setFranchisePhleboStatus(
  id: string,
  isActive: boolean,
): Promise<PhlebotomistDto> {
  const response = await httpClient.patch<ApiResponseBody<PhlebotomistDto>>(
    `/franchise/phlebos/${id}/status`,
    { isActive },
    { suppressErrorToast: true },
  );
  return response.data.data as PhlebotomistDto;
}

// --- Reports ---------------------------------------------------------------

export interface FranchiseReportRow {
  id: string;
  reportNo: string;
  patientName: string;
  patientId: string;
  status: string;
  isEmergency: boolean;
  createdAt: string;
}

export async function fetchFranchiseReports(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: FranchiseReportRow[]; total: number }> {
  const response = await httpClient.get<
    ApiResponseBody<{ rows: FranchiseReportRow[]; total: number }>
  >("/franchise/reports", { params, suppressErrorToast: true });
  return response.data.data as { rows: FranchiseReportRow[]; total: number };
}

// --- Price list ------------------------------------------------------------

export interface FranchisePriceListItem {
  itemType: PriceListItemType;
  itemId: string;
  name: string;
  catalogPrice: number;
  overridePrice: number | null;
  effectivePrice: number;
  /** Whether this franchise offers the item at all — false removes it from
   *  this franchise's city catalogue if it happens to be that city's parent
   *  franchise. Defaults to true. */
  isOffered: boolean;
  /** See `PriceListPricingItem.isParameter`. */
  isParameter: boolean;
}

export interface FranchisePriceList {
  id: string;
  name: string;
  itemsByType: Record<PriceListItemType, FranchisePriceListItem[]>;
}

export async function fetchFranchisePriceList(): Promise<FranchisePriceList> {
  const response = await httpClient.get<ApiResponseBody<FranchisePriceList>>(
    "/franchise/price-list",
    { suppressErrorToast: true },
  );
  return response.data.data as FranchisePriceList;
}

export async function saveFranchisePriceListItems(
  items: { itemType: PriceListItemType; itemId: string; price: number; isOffered: boolean }[],
): Promise<FranchisePriceList> {
  const response = await httpClient.put<ApiResponseBody<FranchisePriceList>>(
    "/franchise/price-list/items",
    { items },
    { suppressErrorToast: true },
  );
  return response.data.data as FranchisePriceList;
}

// --- Service areas -----------------------------------------------------
//
// Read-only from the franchise's side; an admin assigns these from
// Superadmin (`organizationApi.ts#setOrganizationServiceAreasApi`).

export interface FranchiseServiceArea {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
  stateName: string;
}

export async function fetchFranchiseServiceAreas(): Promise<FranchiseServiceArea[]> {
  const response = await httpClient.get<ApiResponseBody<FranchiseServiceArea[]>>(
    "/franchise/service-areas",
    { suppressErrorToast: true },
  );
  return response.data.data ?? [];
}

// --- Area requests -----------------------------------------------------
//
// A franchise proposing new coverage in its own city — pending Superadmin's
// "Area Approval" review (Cities & Areas). See the backend's
// `AreaApprovalRequest` doc-comment for the full approve/reject flow.

export type AreaApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AreaApprovalRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  cityId: string;
  cityName: string;
  name: string;
  pincodes: string[];
  status: AreaApprovalStatus;
  rejectionReason: string | null;
  approvedAreaId: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface CreateAreaRequestBody {
  name: string;
  pincodes?: string[];
}

export async function fetchOwnAreaRequests(): Promise<AreaApprovalRequest[]> {
  const response = await httpClient.get<ApiResponseBody<AreaApprovalRequest[]>>(
    "/franchise/area-requests",
    { suppressErrorToast: true },
  );
  return response.data.data ?? [];
}

export async function createAreaRequest(body: CreateAreaRequestBody): Promise<AreaApprovalRequest> {
  const response = await httpClient.post<ApiResponseBody<AreaApprovalRequest>>(
    "/franchise/area-requests",
    body,
    { suppressErrorToast: true },
  );
  return response.data.data as AreaApprovalRequest;
}

// --- Notifications -----------------------------------------------------
//
// This franchise's own in-app feed (e.g. "New booking"). SMS isn't wired up
// yet — see the backend's `organizationNotification.service.ts` doc-comment.

export interface OrganizationNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  targetId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface OrganizationNotificationList {
  rows: OrganizationNotification[];
  unreadCount: number;
  page: number;
  totalPages: number;
  total: number;
}

export async function fetchFranchiseNotifications(params?: {
  page?: number;
  pageSize?: number;
}): Promise<OrganizationNotificationList> {
  const response = await httpClient.get<ApiResponseBody<OrganizationNotificationList>>(
    "/franchise/notifications",
    { params, suppressErrorToast: true },
  );
  return response.data.data as OrganizationNotificationList;
}

export async function markFranchiseNotificationRead(id: string): Promise<void> {
  await httpClient.patch(`/franchise/notifications/${id}/read`, undefined, {
    suppressErrorToast: true,
  });
}

export async function markAllFranchiseNotificationsRead(): Promise<{ markedCount: number }> {
  const response = await httpClient.patch<ApiResponseBody<{ markedCount: number }>>(
    "/franchise/notifications/read-all",
    undefined,
    { suppressErrorToast: true },
  );
  return response.data.data as { markedCount: number };
}

// --- Change password -------------------------------------------------------

/** Not under /franchise: password change is a property of the User, not the
 *  franchise, and staff logins use the same endpoint. */
export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await httpClient.post<
    ApiResponseBody<{ accessToken: string; refreshToken: string }>
  >("/auth/change-password", input, { suppressErrorToast: true });
  return response.data.data as { accessToken: string; refreshToken: string };
}

/** Same reasoning as `changePassword`: a property of the User, shared by
 *  admin and franchise logins. Returns a fresh token pair because the access
 *  token embeds the username. */
export async function changeUsername(input: {
  currentPassword: string;
  newUsername: string;
}): Promise<{ accessToken: string; refreshToken: string; username: string }> {
  const response = await httpClient.post<
    ApiResponseBody<{ accessToken: string; refreshToken: string; username: string }>
  >("/auth/change-username", input, { suppressErrorToast: true });
  return response.data.data as { accessToken: string; refreshToken: string; username: string };
}

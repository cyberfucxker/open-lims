import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

/** Row shape returned by `GET /app-users` (list). */
export interface AppUserListRow {
  id: string;
  name: string | null;
  mobile: string;
  email: string | null;
  cityName: string | null;
  isActive: boolean;
  isProfileComplete: boolean;
  orderCount: number;
  walletBalance: number;
  platform: "ANDROID" | "IOS" | "WEB" | "WHATSAPP";
  createdAt: string;
}

export interface ListAppUsersParams {
  search?: string;
  cityId?: string;
  isActive?: boolean;
  registeredFrom?: string;
  registeredTo?: string;
  minBalance?: number;
  maxBalance?: number;
  /** Audience-segment style filter ("N+ orders") — e.g. the Notifications
   *  page's "Filtered segment" builder. */
  minOrderCount?: number;
  sortBy?: "createdAt" | "walletBalance";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

/** `.profile` section of `GET /app-users/:id`. */
export interface AppUserProfile {
  id: string;
  name: string | null;
  mobile: string;
  email: string | null;
  gender: string | null;
  dob: string | null;
  city: { id: string; name: string } | null;
  isProfileComplete: boolean;
  isActive: boolean;
  createdAt: string;
}

/** One entry in `.addresses` — note the real shape has houseNo/apartment/address/
 *  locality/landmark rather than the old mock's single `line1` field. */
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

export interface AppUserWalletTransaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  source: string;
  referenceId: string | null;
  note: string | null;
  balanceAfter: number;
  createdAt: string;
}

export interface WalletStats {
  totalLiability: number;
  customersWithBalance: number;
  avgBalance: number;
  totalCreditsThisMonth: number;
}

export interface AdjustWalletInput {
  type: "CREDIT" | "DEBIT";
  amount: number;
  reason: string;
}

export interface AppUserWallet {
  balance: number;
  currency: string;
  transactions: AppUserWalletTransaction[];
}

/** One entry in `.orders` — real fields only (orderNumber/status/totalPayable/
 *  paymentMode/paymentStatus/orderDate), not the old mock's `UserAppOrder` shape. */
export interface AppUserOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalPayable: number;
  paymentMode: string;
  paymentStatus: string | null;
  createdAt: string;
}

export interface AppUserDetail {
  profile: AppUserProfile;
  addresses: AppUserAddress[];
  wallet: AppUserWallet;
  orders: AppUserOrder[];
}

export async function fetchAppUsers(
  params: ListAppUsersParams = {},
): Promise<PaginatedResult<AppUserListRow>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<AppUserListRow>>>(
    "/app-users",
    { params, suppressErrorToast: true },
  );
  return response.data.data as PaginatedResult<AppUserListRow>;
}

export async function fetchAppUser(id: string): Promise<AppUserDetail> {
  const response = await httpClient.get<ApiResponseBody<AppUserDetail>>(`/app-users/${id}`, {
    suppressErrorToast: true,
  });
  return response.data.data as AppUserDetail;
}

export async function setAppUserStatusApi(id: string, isActive: boolean): Promise<AppUserProfile> {
  const response = await httpClient.patch<ApiResponseBody<AppUserProfile>>(
    `/app-users/${id}/status`,
    { isActive },
    { suppressErrorToast: true },
  );
  return response.data.data as AppUserProfile;
}

/** `mobile` is deliberately absent — it's the Patient App's OTP login key,
 *  immutable from this panel. */
export interface AppUserFormValues {
  name?: string | null;
  email?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  dob?: string | null;
  cityId?: string | null;
}

export async function updateAppUserApi(
  id: string,
  values: AppUserFormValues,
): Promise<AppUserProfile> {
  const response = await httpClient.put<ApiResponseBody<AppUserProfile>>(
    `/app-users/${id}`,
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as AppUserProfile;
}

export async function fetchWalletStats(): Promise<WalletStats> {
  const response = await httpClient.get<ApiResponseBody<WalletStats>>("/app-users/wallet-stats", {
    suppressErrorToast: true,
  });
  return response.data.data as WalletStats;
}

export async function adjustWalletApi(
  appUserId: string,
  input: AdjustWalletInput,
): Promise<AppUserWallet> {
  const response = await httpClient.post<ApiResponseBody<AppUserWallet>>(
    `/app-users/${appUserId}/wallet/adjust`,
    input,
    { suppressErrorToast: true },
  );
  return response.data.data as AppUserWallet;
}

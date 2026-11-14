/** Shared shapes for the Superadmin "User Management" module — this manages
 *  `AppUser`, the Patient App's own mobile+OTP login account, a completely
 *  separate model from the LIMS `Patient`/`User` (staff) tables. */

export interface ListAppUsersParams {
  search?: string;
  cityId?: string;
  isActive?: string;
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

/** One row of the paginated customer list. */
export interface AppUserListRowDto {
  id: string;
  name: string | null;
  mobile: string;
  email: string | null;
  cityName: string | null;
  isActive: boolean;
  isProfileComplete: boolean;
  orderCount: number;
  walletBalance: number;
  /** Last platform this account logged in from — "WEB" when unknown
   *  (pre-migration rows, or a genuine web login). */
  platform: "ANDROID" | "IOS" | "WEB" | "WHATSAPP";
  createdAt: string;
}

export interface ListAppUsersResult {
  rows: AppUserListRowDto[];
  total: number;
}

/** Also doubles as the response shape of the block/unblock (status) patch. */
export interface AppUserProfileDto {
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

export interface AppUserAddressDto {
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

export interface AppUserWalletTransactionDto {
  id: string;
  type: string;
  amount: number;
  source: string;
  referenceId: string | null;
  note: string | null;
  balanceAfter: number;
  createdAt: string;
}

export interface AppUserWalletDto {
  balance: number;
  currency: string;
  transactions: AppUserWalletTransactionDto[];
}

/** Aggregate stats across all customer wallets — powers the Wallet
 *  Management dashboard's stat cards. */
export interface WalletStatsDto {
  totalLiability: number;
  customersWithBalance: number;
  avgBalance: number;
  totalCreditsThisMonth: number;
}

/** An admin manually crediting/debiting a customer's wallet (goodwill,
 *  correction, etc.) — always requires a typed reason for the audit trail. */
export interface AdjustWalletInput {
  type: "CREDIT" | "DEBIT";
  amount: number;
  reason: string;
}

export interface AppUserOrderDto {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalPayable: number;
  paymentMode: string | null;
  paymentStatus: string | null;
  createdAt: string;
}

export interface AppUserDetailDto {
  profile: AppUserProfileDto;
  addresses: AppUserAddressDto[];
  wallet: AppUserWalletDto;
  orders: AppUserOrderDto[];
}

export interface SetAppUserStatusInput {
  isActive: boolean;
}

/** All fields an admin can edit — `mobile` is deliberately excluded, it's
 *  the Patient App's OTP login key and immutable from this panel. */
export interface UpdateAppUserInput {
  name?: string | null;
  email?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  dob?: string | null;
  cityId?: string | null;
}

import type { ListMasterParams } from "./master.types";

export type OrganizationType = "GENERAL_CENTER" | "COLLECTION_CENTER";
export type OrgPaymentType = "PREPAID" | "POSTPAID";

export const ORGANIZATION_MODULES = ["patients", "samples", "reports", "invoices"] as const;
export type OrganizationModule = (typeof ORGANIZATION_MODULES)[number];

export const DELIVERY_CHANNELS = ["WHATSAPP", "EMAIL", "SMS"] as const;
export type DeliveryChannel = (typeof DELIVERY_CHANNELS)[number];

export interface OrganizationLoginInfo {
  userId: string;
  username: string;
  isActive: boolean;
  roleId: string;
  roleName: string;
}

export const FRANCHISE_TYPES = ["SINGLE_LAB", "CO_LAB"] as const;
export type FranchiseType = (typeof FRANCHISE_TYPES)[number];

export interface OrganizationDto {
  id: string;
  code: string;
  name: string;
  type: OrganizationType;
  contactPerson: string | null;
  mobile: string;
  email: string | null;
  country: string | null;
  state: string | null;
  /** Denormalised city name — kept for the LIMS list/filter, and mirrored from
   *  `cityId` whenever the Superadmin form picks one. */
  city: string | null;
  cityId: string | null;
  cityName: string | null;
  pincode: string | null;
  address: string | null;
  description: string | null;

  franchiseType: FranchiseType;
  /** Co-Lab branding overrides; both null for a SINGLE_LAB franchise, which
   *  renders the global report settings (global) branding instead. */
  labName: string | null;
  labLogoPath: string | null;

  /** The franchise's PRIVATE price list clone — what its prices actually come
   *  from. Never a shared template. */
  priceListId: string | null;
  priceListName: string | null;
  /** The admin template that clone was minted from. This, not `priceListId`, is
   *  what the Superadmin "Initial Price List" dropdown shows as selected. */
  priceListTemplateId: string | null;
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

  /** Manually-set referral commission rate — a business policy, not computed. */
  commissionPct: number;
  /** Live aggregates over this org's patients' appointments/bills — computed
   *  per-request, not stored columns. See `organization.repository.ts#getOrgMetrics`. */
  orderCount: number;
  settlementDue: number;

  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationWriteData {
  name: string;
  /** Optional on create: the Superadmin franchise form does not collect it and
   *  the service defaults it to COLLECTION_CENTER. Still required by the LIMS
   *  organization form, which does. */
  type?: OrganizationType;
  contactPerson?: string | null;
  mobile: string;
  email?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  cityId?: string | null;
  pincode?: string | null;
  address?: string | null;
  description?: string | null;

  franchiseType?: FranchiseType;
  labName?: string | null;
  labLogoPath?: string | null;

  priceListId?: string | null;
  paymentType?: OrgPaymentType;
  creditLimit?: number;
  advanceAmount?: number;
  dueDays?: number;
  source?: string | null;
  billingRules?: string | null;
  invoiceRules?: string | null;
  reportDeliveryChannels?: DeliveryChannel[];
  billDeliveryChannels?: DeliveryChannel[];

  commissionPct?: number;
  active?: boolean;
}

/** `POST /organizations` body. The optional credentials create the franchise's
 *  portal login in the same transaction as the organization itself — supply
 *  both to get a login, neither to create an organization without portal
 *  access. The role is not accepted from the client: a login created this way
 *  is always FRANCHISE. */
export interface CreateOrganizationData extends OrganizationWriteData {
  username?: string;
  password?: string;
}

export interface ListOrganizationsParams extends ListMasterParams {
  type?: OrganizationType;
  franchiseType?: FranchiseType;
  priceListId?: string;
  /** Scopes the list to franchises assigned to this city — used by the
   *  "Parent Franchise" picker (`City.parentOrganizationId`), which may only
   *  offer franchises already assigned to that city. */
  cityId?: string;
}

export interface ListOrganizationsResult {
  rows: OrganizationDto[];
  total: number;
  /** Sums over the FULL filtered set (not just this page) — computed
   *  alongside the same per-org metrics query, not a second round trip. */
  totalOrderVolume: number;
  totalSettlementDue: number;
}

export interface EnableLoginInput {
  username: string;
  password: string;
  roleId: string;
  enabledModules: OrganizationModule[];
}

export interface UpdateLoginInput {
  roleId?: string;
  enabledModules?: OrganizationModule[];
  isActive?: boolean;
  password?: string;
}

export interface OrganizationAuditLogDto {
  id: string;
  action: string;
  performedByUserId: string | null;
  note: string | null;
  createdAt: string;
}

/** An Area this franchise is assigned to cover — see `OrganizationServiceArea`. */
export interface OrganizationServiceAreaDto {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
}

export type OrganizationType = "GENERAL_CENTER" | "COLLECTION_CENTER";
export type OrgPaymentType = "PREPAID" | "POSTPAID";
export type OrganizationModule = "patients" | "samples" | "reports" | "invoices";
export type DeliveryChannel = "WHATSAPP" | "EMAIL" | "SMS";

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
  pincode: string | null;
  address: string | null;
  description: string | null;

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

  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationFormValues {
  name: string;
  type: OrganizationType;
  contactPerson?: string;
  mobile: string;
  email?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  address?: string;
  description?: string;

  priceListId?: string;
  paymentType: OrgPaymentType;
  creditLimit: number;
  advanceAmount: number;
  dueDays: number;
  source?: string;
  billingRules?: string;
  invoiceRules?: string;
  reportDeliveryChannels: DeliveryChannel[];
  billDeliveryChannels: DeliveryChannel[];

  active: boolean;
}

export interface ListOrganizationsParams {
  search?: string;
  type?: OrganizationType | "all";
  active?: string;
  includeDeleted?: boolean;
  priceListId?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ListOrganizationsResult {
  rows: Organization[];
  total: number;
}

export interface EnableLoginValues {
  username: string;
  password: string;
  roleId: string;
  enabledModules: OrganizationModule[];
}

export interface UpdateLoginValues {
  roleId?: string;
  enabledModules?: OrganizationModule[];
  isActive?: boolean;
  password?: string;
}

export interface OrganizationAuditLog {
  id: string;
  action: string;
  performedByUserId: string | null;
  note: string | null;
  createdAt: string;
}

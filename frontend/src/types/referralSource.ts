export type ReferralType = "DOCTOR" | "HOSPITAL" | "CLINIC" | "SELF" | "CORPORATE" | "OTHER";

export interface ReferralSource {
  id: string;
  referralCode: string;
  referralType: ReferralType;
  name: string;
  organizationId: string | null;
  organizationName: string | null;
  mobile: string;
  email: string | null;
  speciality: string | null;
  address: string | null;
  city: string | null;
  marketingStaffId: string | null;
  marketingStaffName: string | null;
  assignedPriceListId: string | null;
  assignedPriceListName: string | null;
  commissionPercentage: number;
  status: boolean;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralSourceFormValues {
  referralType: ReferralType;
  name: string;
  organizationId?: string | null;
  mobile: string;
  email?: string | null;
  speciality?: string | null;
  address?: string | null;
  city?: string | null;
  marketingStaffId?: string | null;
  assignedPriceListId?: string | null;
  commissionPercentage?: number;
  status?: boolean;
  notes?: string | null;
}

export interface ListReferralSourcesParams {
  search?: string;
  active?: string;
  includeDeleted?: boolean;
  referralType?: ReferralType;
  marketingStaffId?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ListReferralSourcesResult {
  rows: ReferralSource[];
  total: number;
}

export interface PriceListAssignmentHistoryEntry {
  id: string;
  priceListId: string;
  priceListName: string;
  assignedBy: string;
  assignedAt: string;
}

export interface PriceListAssignmentView {
  assignedPriceListId: string | null;
  assignedPriceListName: string | null;
  history: PriceListAssignmentHistoryEntry[];
}

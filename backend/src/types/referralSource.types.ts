export type ReferralType = "DOCTOR" | "HOSPITAL" | "CLINIC" | "SELF" | "CORPORATE" | "OTHER";

export interface ReferralSourceDto {
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

export interface ReferralSourceWriteData {
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
  includeDeleted?: string;
  referralType?: ReferralType;
  marketingStaffId?: string;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}

export interface ListReferralSourcesResult {
  rows: ReferralSourceDto[];
  total: number;
}

export interface ReferralSourceAuditLogDto {
  id: string;
  action: string;
  performedByUserId: string | null;
  note: string | null;
  createdAt: string;
}

export interface AssignPriceListInput {
  priceListId: string;
}

export interface ReferralPriceAssignmentDto {
  id: string;
  priceListId: string;
  priceListName: string;
  assignedBy: string | null;
  assignedAt: string;
}

export interface ReferralPriceAssignmentView {
  assignedPriceListId: string | null;
  assignedPriceListName: string | null;
  history: ReferralPriceAssignmentDto[];
}

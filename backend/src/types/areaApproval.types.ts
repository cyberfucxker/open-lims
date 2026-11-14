export const AREA_APPROVAL_STATUS_VALUES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type AreaApprovalStatus = (typeof AREA_APPROVAL_STATUS_VALUES)[number];

export interface AreaApprovalRequestDto {
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

export interface CreateAreaApprovalRequestInput {
  name: string;
  pincodes?: string[];
}

export interface ListAreaApprovalRequestsParams {
  status?: AreaApprovalStatus;
  page?: number;
  pageSize?: number;
}

export interface ListAreaApprovalRequestsResult {
  rows: AreaApprovalRequestDto[];
  total: number;
}

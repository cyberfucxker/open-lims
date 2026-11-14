import type { ListMasterParams } from "./master.types";

export interface MarketingStaffDto {
  id: string;
  employeeCode: string;
  name: string;
  mobile: string;
  email: string | null;
  designation: string | null;
  branchId: string | null;
  joiningDate: string;
  referralDoctorCount: number;
  status: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingStaffWriteData {
  employeeCode: string;
  name: string;
  mobile: string;
  email?: string | null;
  designation?: string | null;
  branchId?: string | null;
  joiningDate: string;
  status?: boolean;
}

export type ListMarketingStaffParams = ListMasterParams;

export interface ListMarketingStaffResult {
  rows: MarketingStaffDto[];
  total: number;
}

export interface MarketingStaffAuditLogDto {
  id: string;
  action: string;
  performedByUserId: string | null;
  note: string | null;
  createdAt: string;
}

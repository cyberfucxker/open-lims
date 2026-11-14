export interface MarketingStaff {
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

export interface MarketingStaffFormValues {
  employeeCode: string;
  name: string;
  mobile: string;
  email?: string;
  designation?: string;
  branchId?: string;
  joiningDate: string;
  status: boolean;
}

export interface ListMarketingStaffParams {
  search?: string;
  active?: string;
  includeDeleted?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ListMarketingStaffResult {
  rows: MarketingStaff[];
  total: number;
}

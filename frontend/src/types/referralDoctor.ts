export interface ReferralDoctor {
  id: string;
  doctorName: string;
  hospitalName: string | null;
  speciality: string | null;
  mobile: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  remarks: string | null;
  marketingStaffId: string | null;
  marketingStaffName: string | null;
  status: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralDoctorFormValues {
  doctorName: string;
  hospitalName?: string | null;
  speciality?: string | null;
  mobile?: string | null;
  email?: string | null;
  city?: string | null;
  address?: string | null;
  remarks?: string | null;
  marketingStaffId?: string | null;
  status: boolean;
}

export interface ListReferralDoctorsParams {
  search?: string;
  active?: string;
  includeDeleted?: boolean;
  marketingStaffId?: string;
  unassignedOnly?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ListReferralDoctorsResult {
  rows: ReferralDoctor[];
  total: number;
}

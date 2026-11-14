export interface DoctorVisitDto {
  id: string;
  marketingStaffId: string;
  marketingStaffName: string;
  referralDoctorId: string;
  referralDoctorName: string;
  visitDate: string;
  nextVisitDate: string | null;
  remarks: string | null;
  createdAt: string;
}

export interface CreateDoctorVisitInput {
  marketingStaffId: string;
  referralDoctorId: string;
  visitDate: string;
  nextVisitDate?: string | null;
  remarks?: string | null;
}

export interface ListDoctorVisitsParams {
  marketingStaffId?: string;
  referralDoctorId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ListDoctorVisitsResult {
  rows: DoctorVisitDto[];
  total: number;
}

export interface UpcomingVisitsParams {
  withinDays?: number;
}

export interface MonthlyTargetDto {
  id: string;
  marketingStaffId: string;
  marketingStaffName: string;
  month: number;
  year: number;
  revenueTarget: number;
  doctorTarget: number;
  patientTarget: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertMonthlyTargetInput {
  marketingStaffId: string;
  month: number;
  year: number;
  revenueTarget: number;
  doctorTarget: number;
  patientTarget: number;
}

export interface ListMonthlyTargetsParams {
  marketingStaffId?: string;
  month?: number;
  year?: number;
}

export interface ListMonthlyTargetsResult {
  rows: MonthlyTargetDto[];
}

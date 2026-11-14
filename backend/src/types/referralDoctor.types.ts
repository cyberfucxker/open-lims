import type { ListMasterParams } from "./master.types";

export interface ReferralDoctorDto {
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

export interface ReferralDoctorWriteData {
  doctorName: string;
  hospitalName?: string | null;
  speciality?: string | null;
  mobile?: string | null;
  email?: string | null;
  city?: string | null;
  address?: string | null;
  remarks?: string | null;
  marketingStaffId?: string | null;
  status?: boolean;
}

export interface ListReferralDoctorsParams extends ListMasterParams {
  marketingStaffId?: string;
  unassignedOnly?: string;
}

export interface ListReferralDoctorsResult {
  rows: ReferralDoctorDto[];
  total: number;
}

export interface ReferralDoctorAuditLogDto {
  id: string;
  action: string;
  performedByUserId: string | null;
  note: string | null;
  createdAt: string;
}

export interface AssignDoctorInput {
  marketingStaffId: string;
}

export interface BulkAssignDoctorsInput {
  doctorIds: string[];
  marketingStaffId: string;
}

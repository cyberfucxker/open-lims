export type PrescriptionStatus = "SUBMITTED" | "APPROVED" | "REJECTED";

export interface PrescriptionCity {
  id: string;
  name: string;
}

export interface PrescriptionItem {
  id: string;
  name: string | null;
  phone: string | null;
  relation: string | null;
  city: PrescriptionCity | null;
  query: string | null;
  file_url: string;
  status: PrescriptionStatus;
  created_at: string;
}

export interface SubmitPrescriptionRequest {
  family_member_id: string;
  city_id: string;
  query?: string;
  prescription_file: File;
}

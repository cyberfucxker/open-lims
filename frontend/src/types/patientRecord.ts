/** Real `/patients` DTO shape (mirrors backend/src/types/patient.types.ts
 *  exactly). Kept separate from the legacy mock-backed `types/patient.ts`
 *  (whose `Patient`/`ListPatientsParams` carry fields like `franchise`/
 *  `doctor` that don't exist on the real API) — this is the type the
 *  Collection Center portal (and any future real Patient integration) should
 *  build against instead. */
export type PatientGender = "Male" | "Female" | "Other";

export interface PatientRecord {
  id: string;
  patientId: string;
  optionalPatientId: string | null;
  title: string;
  fullName: string;
  gender: PatientGender;
  dob: string;
  age: number;
  mobile: string;
  email: string | null;
  organization: string | null;
  referral: string | null;
  organizationId: string | null;
  referralDoctorId: string | null;
  referralSourceId: string | null;
  whatsappOptIn: boolean;
  smsOptIn: boolean;
  emailOptIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListPatientRecordsParams {
  search?: string;
  gender?: PatientGender;
  mobile?: string;
  email?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ListPatientRecordsResult {
  rows: PatientRecord[];
  total: number;
}

export type PatientRegisterPaymentMode =
  "Cash" | "Card" | "UPI" | "Insurance" | "Credit" | "Online";

export interface RegisterPatientRecordInput {
  optionalPatientId?: string;
  title: string;
  fullName: string;
  gender: PatientGender;
  dob: string;
  mobile?: string;
  email?: string;
  /** Structured link to the Marketing Staff module's ReferralDoctor —
   *  additive alongside the legacy free-text `referral` field. */
  referralDoctorId?: string;
  /** Structured link to the (fully separate) Referral Management module's
   *  ReferralSource. */
  referralSourceId?: string;
  whatsappOptIn?: boolean;
  smsOptIn?: boolean;
  emailOptIn?: boolean;
  testIds: string[];
  discountPercent?: number;
  paymentMode: PatientRegisterPaymentMode;
  amountPaid?: number;
  isEmergency?: boolean;
}

export interface PatientRecordAppointmentSummary {
  id: string;
  appointmentNo: string;
  netAmount: number;
  amountPaid: number;
  dueAmount: number;
  paymentStatus: string;
}

export interface RegisterPatientRecordResult {
  patient: PatientRecord;
  appointment: PatientRecordAppointmentSummary;
}

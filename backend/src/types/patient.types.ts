/** Title-Case to match the frontend's existing patientSchema.ts exactly —
 *  mapped to/from the DB's upper-snake Prisma enum in `utils/enumMappers.ts`. */
export type Gender = "Male" | "Female" | "Other";

/** Whether the patient is a walk-in retail customer or billed through a
 *  linked B2B Organization — same Title-Case/upper-snake mapping convention
 *  as `Gender` above. */
export type PatientType = "Retail" | "B2B";

export interface PatientRecord {
  id: string;
  patientId: string;
  optionalPatientId: string | null;
  title: string;
  fullName: string;
  gender: Gender;
  patientType: PatientType;
  dob: string;
  age: number;
  mobile: string;
  email: string | null;
  address: string | null;
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

export interface PatientWriteData {
  optionalPatientId?: string;
  title: string;
  fullName: string;
  gender: Gender;
  /** Defaults to "Retail" at the DB level when omitted. */
  patientType?: PatientType;
  dob: string;
  mobile: string;
  email?: string;
  address?: string;
  organization?: string;
  referral?: string;
  /** Structured link to the Marketing Staff module's ReferralDoctor —
   *  always client-supplied (an ADMIN staff member picks it directly),
   *  unlike `organizationId` which is portal-derived from `req.user`. */
  referralDoctorId?: string;
  /** Structured link to the (fully separate) Referral Management module's
   *  ReferralSource — always client-supplied, same treatment as
   *  `referralDoctorId` above. */
  referralSourceId?: string;
  whatsappOptIn?: boolean;
  smsOptIn?: boolean;
  emailOptIn?: boolean;
}

export interface ListPatientsParams {
  search?: string;
  gender?: Gender;
  organization?: string;
  referral?: string;
  mobile?: string;
  email?: string;
  createdFrom?: string;
  createdTo?: string;
  /** ADMIN-only optional filter to view one B2B Organization's patients; for
   *  an Organization-linked caller this is always forced to their own id
   *  (see patient.controller.ts), never taken from the query string. */
  organizationId?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ListPatientsResult {
  rows: PatientRecord[];
  total: number;
}

export interface PatientBarcodeResult {
  patientId: string;
  fullName: string;
  gender: Gender;
  age: number;
  mobile: string;
  barcodeImage: string;
}

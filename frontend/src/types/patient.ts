export type Gender = "Male" | "Female" | "Other";
export type PatientType = "Retail" | "B2B";
export type PatientStatus =
  "Registered" | "Sample Collected" | "Processing" | "Completed" | "Authorized";
export type PaymentStatus = "Paid" | "Partial" | "Pending";
export type PaymentMode = "Cash" | "Card" | "UPI" | "Insurance" | "Credit";
export type CollectionType = "Lab Visit" | "Home Collection";

export interface PatientTestLine {
  testId: string;
  name: string;
  price: number;
}

export interface Patient {
  id: string;
  patientId: string;
  title: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: Gender;
  age: number;
  dob: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  address?: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  doctor: string;
  department: string;
  franchise: string;
  patientType: PatientType;
  status: PatientStatus;
  paymentStatus: PaymentStatus;
  registrationDate: string;
  collectionType: CollectionType;
  tests: PatientTestLine[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
}

export interface PatientFormValues {
  optionalPatientId?: string;
  title: string;
  fullName: string;
  gender: Gender;
  patientType: PatientType;
  dob: string;
  mobile?: string;
  email?: string;
  address?: string;
  centerId?: string;
  homeCollection: boolean;
  organization?: string;
  referral?: string;
  /** Structured link to the Marketing Staff module's ReferralDoctor —
   *  additive alongside the legacy free-text `referral` field above. */
  referralDoctorId?: string;
  /** Structured link to the (fully separate) Referral Management module's
   *  ReferralSource. */
  referralSourceId?: string;
  whatsappOptIn: boolean;
  smsOptIn: boolean;
  emailOptIn: boolean;
  discountPercent: number;
  paymentMode: PaymentMode;
  amountPaid: number;
}

export interface PatientSearchFilters {
  query?: string;
  patientId?: string;
  mobile?: string;
  dateFrom?: string;
  dateTo?: string;
  doctor?: string;
  franchise?: string;
  department?: string;
  status?: string;
  patientType?: string;
}

export interface ListPatientsParams extends PatientSearchFilters {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface ListPatientsResult {
  rows: Patient[];
  total: number;
}

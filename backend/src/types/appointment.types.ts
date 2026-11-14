import type { PatientWriteData } from "./patient.types";

export type AppointmentStatus =
  "REGISTERED" | "SAMPLE_COLLECTED" | "PROCESSING" | "COMPLETED" | "CANCELLED";
/** Title-Case to match the frontend's existing patientSchema.ts exactly —
 *  mapped to/from the DB's upper-snake Prisma enum in `utils/enumMappers.ts`.
 *  "Wallet" was added for the Patient App (see `PaymentMode` in
 *  schema.prisma) — the admin/franchise frontend never sends it. */
export type PaymentMode = "Cash" | "Card" | "UPI" | "Insurance" | "Credit" | "Online" | "Wallet";
export type PaymentStatus = "PAID" | "PARTIAL" | "PENDING";

export interface AppointmentTestLine {
  testId: string;
  testName: string;
  price: number;
}

export interface AppointmentPatientSummary {
  id: string;
  patientId: string;
  fullName: string;
  mobile: string;
  gender: string;
  age: number;
}

export interface AppointmentRecord {
  id: string;
  appointmentNo: string;
  patientId: string;
  patient?: AppointmentPatientSummary;
  status: AppointmentStatus;
  appointmentDate: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  netAmount: number;
  paymentMode: PaymentMode;
  amountPaid: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  isEmergency: boolean;
  centerId: string | null;
  centerName: string | null;
  homeCollection: boolean;
  tests: AppointmentTestLine[];
  createdAt: string;
  updatedAt: string;
}

/** Billing/payment fields for creating an appointment — `testIds` is the only
 *  thing the client picks; subtotal/discountAmount/netAmount/dueAmount/
 *  paymentStatus are always computed server-side from the live Test prices. */
export interface CreateAppointmentInput {
  testIds: string[];
  discountPercent?: number;
  paymentMode: PaymentMode;
  amountPaid?: number;
  isEmergency?: boolean;
  centerId?: string;
  homeCollection?: boolean;
}

/** New Registration: patient fields + first appointment's billing fields, flat —
 *  mirrors the frontend's existing `{ ...patientFormValues, testIds }` POST shape. */
export type RegisterPatientInput = PatientWriteData & CreateAppointmentInput;

export interface ListAppointmentsParams {
  patientId?: string;
  status?: AppointmentStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ListAppointmentsResult {
  rows: AppointmentRecord[];
  total: number;
}

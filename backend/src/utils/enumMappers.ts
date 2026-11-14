import type {
  Gender as DbGender,
  PatientType as DbPatientType,
  PaymentMode as DbPaymentMode,
} from "@prisma/client";
import type { Gender, PatientType } from "../types/patient.types";
import type { PaymentMode } from "../types/appointment.types";

/**
 * The frontend UI works with Title-Case values ("Male", "Cash", ...) — the
 * same casing patientSchema.ts/BillingSummaryPanel already use — while the
 * database stores the conventional upper-snake Prisma enum values. These
 * mappers keep that translation in one place instead of scattering
 * uppercase/lowercase calls across services.
 */

const GENDER_TO_DB: Record<Gender, DbGender> = {
  Male: "MALE",
  Female: "FEMALE",
  Other: "OTHER",
};
const GENDER_FROM_DB: Record<DbGender, Gender> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

export function toDbGender(value: Gender): DbGender {
  return GENDER_TO_DB[value];
}
export function fromDbGender(value: DbGender): Gender {
  return GENDER_FROM_DB[value];
}

const PATIENT_TYPE_TO_DB: Record<PatientType, DbPatientType> = {
  Retail: "RETAIL",
  B2B: "B2B",
};
const PATIENT_TYPE_FROM_DB: Record<DbPatientType, PatientType> = {
  RETAIL: "Retail",
  B2B: "B2B",
};

export function toDbPatientType(value: PatientType): DbPatientType {
  return PATIENT_TYPE_TO_DB[value];
}
export function fromDbPatientType(value: DbPatientType): PatientType {
  return PATIENT_TYPE_FROM_DB[value];
}

const PAYMENT_MODE_TO_DB: Record<PaymentMode, DbPaymentMode> = {
  Cash: "CASH",
  Card: "CARD",
  UPI: "UPI",
  Insurance: "INSURANCE",
  Credit: "CREDIT",
  Online: "ONLINE",
  Wallet: "WALLET",
};
const PAYMENT_MODE_FROM_DB: Record<DbPaymentMode, PaymentMode> = {
  CASH: "Cash",
  CARD: "Card",
  UPI: "UPI",
  INSURANCE: "Insurance",
  CREDIT: "Credit",
  ONLINE: "Online",
  WALLET: "Wallet",
};

export function toDbPaymentMode(value: PaymentMode): DbPaymentMode {
  return PAYMENT_MODE_TO_DB[value];
}
export function fromDbPaymentMode(value: DbPaymentMode): PaymentMode {
  return PAYMENT_MODE_FROM_DB[value];
}

/** `BROTHER` -> `Brother`. The patient app has always shown a family
 *  member's relation title-cased (Get Family Members, Review Cart), so every
 *  surface that returns one goes through here rather than leaking the raw
 *  Prisma enum to a client that would then have to case it itself. */
export function toRelationLabel(relation: string): string {
  return relation.charAt(0) + relation.slice(1).toLowerCase();
}

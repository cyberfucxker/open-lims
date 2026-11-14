import type { Patient, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { fromDbGender, fromDbPatientType, toDbGender, toDbPatientType } from "../utils/enumMappers";
import { joinFullName, splitFullName } from "../utils/name";
import type { ListPatientsParams, PatientRecord, PatientWriteData } from "../types/patient.types";

export function computeAge(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return Math.max(0, age);
}

/** Maps a Prisma row to the exact shape the API returns — `firstName`/`lastName`
 *  are storage details only; the API surface matches the frontend's single
 *  "Full Name" field. */
export function toPatientRecord(patient: Patient): PatientRecord {
  return {
    id: patient.id,
    patientId: patient.patientId,
    optionalPatientId: patient.optionalPatientId,
    title: patient.title,
    fullName: joinFullName(patient.firstName, patient.lastName),
    gender: fromDbGender(patient.gender),
    patientType: fromDbPatientType(patient.patientType),
    dob: patient.dob.toISOString().slice(0, 10),
    age: computeAge(patient.dob),
    mobile: patient.mobile,
    email: patient.email,
    address: patient.address,
    organization: patient.organization,
    referral: patient.referral,
    organizationId: patient.organizationId,
    referralDoctorId: patient.referralDoctorId,
    referralSourceId: patient.referralSourceId,
    whatsappOptIn: patient.whatsappOptIn,
    smsOptIn: patient.smsOptIn,
    emailOptIn: patient.emailOptIn,
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString(),
  };
}

export interface ListPatientsFilter extends Pick<
  ListPatientsParams,
  | "search"
  | "gender"
  | "organization"
  | "referral"
  | "mobile"
  | "email"
  | "createdFrom"
  | "createdTo"
  | "organizationId"
> {
  skip: number;
  take: number;
  sortBy: string;
  sortDir: "asc" | "desc";
}

const SORTABLE_FIELDS = new Set(["createdAt", "firstName", "lastName", "mobile", "patientId"]);

function buildWhere(
  filter: Pick<
    ListPatientsFilter,
    | "search"
    | "gender"
    | "organization"
    | "referral"
    | "mobile"
    | "email"
    | "createdFrom"
    | "createdTo"
    | "organizationId"
  >,
): Prisma.PatientWhereInput {
  const where: Prisma.PatientWhereInput = {};

  if (filter.organizationId) {
    where.organizationId = filter.organizationId;
  }
  if (filter.search) {
    where.OR = [
      { patientId: { contains: filter.search, mode: "insensitive" } },
      { optionalPatientId: { contains: filter.search, mode: "insensitive" } },
      { firstName: { contains: filter.search, mode: "insensitive" } },
      { lastName: { contains: filter.search, mode: "insensitive" } },
      { mobile: { contains: filter.search } },
      { email: { contains: filter.search, mode: "insensitive" } },
      { organization: { contains: filter.search, mode: "insensitive" } },
      { referral: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter.gender) where.gender = toDbGender(filter.gender);
  if (filter.organization)
    where.organization = { contains: filter.organization, mode: "insensitive" };
  if (filter.referral) where.referral = { contains: filter.referral, mode: "insensitive" };
  if (filter.mobile) where.mobile = { contains: filter.mobile };
  if (filter.email) where.email = { contains: filter.email, mode: "insensitive" };
  if (filter.createdFrom || filter.createdTo) {
    where.createdAt = {
      ...(filter.createdFrom ? { gte: new Date(filter.createdFrom) } : {}),
      ...(filter.createdTo ? { lte: new Date(filter.createdTo) } : {}),
    };
  }

  return where;
}

export async function listPatients(
  filter: ListPatientsFilter,
): Promise<{ rows: Patient[]; total: number }> {
  const where = buildWhere(filter);
  const orderBy: Prisma.PatientOrderByWithRelationInput = SORTABLE_FIELDS.has(filter.sortBy)
    ? { [filter.sortBy]: filter.sortDir }
    : { createdAt: "desc" };

  const [rows, total] = await Promise.all([
    prisma.patient.findMany({ where, orderBy, skip: filter.skip, take: filter.take }),
    prisma.patient.count({ where }),
  ]);

  return { rows, total };
}

export function findPatientById(id: string) {
  return prisma.patient.findUnique({ where: { id } });
}

/** Same-mobile + same-name (case-insensitive) match — the duplicate-prevention
 *  rule for new registrations. `fullName` is split the same way it is for
 *  storage so the comparison lines up with what's actually in the columns. */
export function findPossibleDuplicate(mobile: string, fullName: string) {
  const { firstName, lastName } = splitFullName(fullName);
  return prisma.patient.findFirst({
    where: {
      mobile,
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    },
  });
}

/** Builds the Prisma write payload from an explicit field whitelist — never a
 *  blind spread of the caller's object — so an unrelated extra property on
 *  the request body (e.g. an appointment field like `paymentMode` sent to
 *  the patient-update endpoint by mistake) is silently ignored instead of
 *  reaching Prisma and blowing up with an "Unknown argument" 500. */
function toPrismaData(data: PatientWriteData) {
  const { firstName, lastName } = splitFullName(data.fullName);
  return {
    optionalPatientId: data.optionalPatientId,
    title: data.title,
    firstName,
    lastName,
    gender: toDbGender(data.gender),
    patientType: data.patientType ? toDbPatientType(data.patientType) : undefined,
    dob: new Date(data.dob),
    mobile: data.mobile,
    email: data.email,
    address: data.address,
    organization: data.organization,
    referral: data.referral,
    // `|| null` (not `??`) deliberately also catches "" — an unselected
    // dropdown on the frontend sends an empty string, and Postgres rejects
    // "" as a UUID for these columns.
    referralDoctorId: data.referralDoctorId || null,
    referralSourceId: data.referralSourceId || null,
    whatsappOptIn: data.whatsappOptIn,
    smsOptIn: data.smsOptIn,
    emailOptIn: data.emailOptIn,
  };
}

/** Always called from within the registration transaction, alongside the first Appointment.
 *  `organizationId` is never taken from client input — the caller (patient.service.ts)
 *  only ever passes it as `req.user.organizationId` when a Collection Center portal
 *  user is registering a patient for their own Organization. */
export function createPatient(
  data: PatientWriteData & { patientId: string; organizationId?: string | null },
  tx: Prisma.TransactionClient,
) {
  const { patientId, organizationId, ...writeData } = data;
  return tx.patient.create({
    data: { ...toPrismaData(writeData), patientId, organizationId: organizationId ?? undefined },
  });
}

export function updatePatient(id: string, data: PatientWriteData) {
  return prisma.patient.update({ where: { id }, data: toPrismaData(data) });
}

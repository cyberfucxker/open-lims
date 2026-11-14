import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { nextAppointmentNo, nextPatientId } from "../utils/idGenerator";
import { generateBarcodeDataUri } from "./barcode.service";
import { resolveTestsAndComputeBilling } from "./appointment.service";
import * as patientRepository from "../repositories/patient.repository";
import { toPatientRecord } from "../repositories/patient.repository";
import * as appointmentRepository from "../repositories/appointment.repository";
import { toAppointmentRecord } from "../repositories/appointment.repository";
import * as billRepository from "../repositories/bill.repository";
import type {
  ListPatientsParams,
  ListPatientsResult,
  PatientBarcodeResult,
  PatientRecord,
  PatientWriteData,
} from "../types/patient.types";
import type { AppointmentRecord, RegisterPatientInput } from "../types/appointment.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

/** Prisma's "record to update not found" (P2025) becomes the same 404 a
 *  missing GET would return, instead of an unhandled 500. */
async function withNotFoundTranslation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Patient not found");
    }
    throw error;
  }
}

export async function listPatients(params: ListPatientsParams): Promise<ListPatientsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await patientRepository.listPatients({
    search: params.search,
    gender: params.gender,
    organization: params.organization,
    referral: params.referral,
    mobile: params.mobile,
    email: params.email,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    organizationId: params.organizationId,
    sortBy: params.sortBy ?? "createdAt",
    sortDir: params.sortDir ?? "desc",
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toPatientRecord), total };
}

/** `scopeOrganizationId` is passed by the controller only for a Collection
 *  Center portal caller — an ADMIN always gets `undefined` (no scoping). A
 *  patient outside the caller's Organization 404s exactly like a missing id,
 *  so the portal can't distinguish "not mine" from "doesn't exist". */
export async function getPatient(id: string, scopeOrganizationId?: string): Promise<PatientRecord> {
  const patient = await patientRepository.findPatientById(id);
  if (!patient || (scopeOrganizationId && patient.organizationId !== scopeOrganizationId)) {
    throw ApiError.notFound("Patient not found");
  }
  return toPatientRecord(patient);
}

export async function updatePatient(id: string, values: PatientWriteData): Promise<PatientRecord> {
  const updated = await withNotFoundTranslation(() => patientRepository.updatePatient(id, values));
  return toPatientRecord(updated);
}

export async function getPatientBarcode(
  id: string,
  scopeOrganizationId?: string,
): Promise<PatientBarcodeResult> {
  const patient = await getPatient(id, scopeOrganizationId);
  const barcodeImage = await generateBarcodeDataUri(patient.patientId);

  return {
    patientId: patient.patientId,
    fullName: patient.fullName,
    gender: patient.gender,
    age: patient.age,
    mobile: patient.mobile,
    barcodeImage,
  };
}

/**
 * New Registration: creates the Patient and its first Appointment (tests +
 * billing + payment) atomically. Runs the mobile+name duplicate check first
 * — the "Already Registered" flow (`appointmentService.createAppointmentForPatient`)
 * is the intended path for a returning patient and never hits this check.
 */
export async function registerPatient(
  input: RegisterPatientInput,
  createdByUserId?: string | null,
  organizationId?: string | null,
): Promise<{ patient: PatientRecord; appointment: AppointmentRecord }> {
  // Skip the check entirely when mobile is blank — an empty mobile isn't a
  // meaningful identity match, and would otherwise flag unrelated patients
  // who share a name but both left mobile blank as duplicates of each other.
  const existing = input.mobile
    ? await patientRepository.findPossibleDuplicate(input.mobile, input.fullName)
    : null;
  if (existing) {
    throw ApiError.conflict(
      `A patient named "${input.fullName}" with mobile ${input.mobile} is already registered. Use "Already Registered" to add a new visit instead.`,
      { existingPatientId: existing.patientId, existingId: existing.id },
    );
  }

  const billing = await resolveTestsAndComputeBilling(
    input.testIds,
    input.discountPercent ?? 0,
    input.amountPaid ?? 0,
  );

  const patientData: PatientWriteData = {
    optionalPatientId: input.optionalPatientId,
    title: input.title,
    fullName: input.fullName,
    gender: input.gender,
    patientType: input.patientType,
    dob: input.dob,
    mobile: input.mobile,
    email: input.email,
    address: input.address,
    organization: input.organization,
    referral: input.referral,
    referralDoctorId: input.referralDoctorId,
    referralSourceId: input.referralSourceId,
    whatsappOptIn: input.whatsappOptIn,
    smsOptIn: input.smsOptIn,
    emailOptIn: input.emailOptIn,
  };

  const { patient, appointment } = await prisma.$transaction(async (tx) => {
    const patientId = await nextPatientId(tx);
    const createdPatient = await patientRepository.createPatient(
      { ...patientData, patientId, organizationId },
      tx,
    );

    const appointmentNo = await nextAppointmentNo(tx);
    const createdAppointment = await appointmentRepository.createAppointment(
      {
        appointmentNo,
        patientId: createdPatient.id,
        subtotal: billing.subtotal,
        discountPercent: billing.discountPercent,
        discountAmount: billing.discountAmount,
        netAmount: billing.netAmount,
        paymentMode: input.paymentMode,
        amountPaid: billing.amountPaid,
        dueAmount: billing.dueAmount,
        paymentStatus: billing.paymentStatus,
        isEmergency: input.isEmergency,
        centerId: input.centerId,
        homeCollection: input.homeCollection,
        createdByUserId,
        tests: billing.tests,
      },
      tx,
    );

    await billRepository.createBillForAppointment(
      {
        appointmentId: createdAppointment.id,
        patientId: createdPatient.id,
        netAmount: billing.netAmount,
        amountPaid: billing.amountPaid,
        dueAmount: billing.dueAmount,
        paymentStatus: billing.paymentStatus,
        paymentMode: input.paymentMode,
        createdByUserId,
      },
      tx,
    );

    return { patient: createdPatient, appointment: createdAppointment };
  });

  return { patient: toPatientRecord(patient), appointment: toAppointmentRecord(appointment) };
}

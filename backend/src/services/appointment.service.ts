import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { nextAppointmentNo } from "../utils/idGenerator";
import * as appointmentRepository from "../repositories/appointment.repository";
import { toAppointmentRecord } from "../repositories/appointment.repository";
import * as testRepository from "../repositories/test.repository";
import * as patientRepository from "../repositories/patient.repository";
import * as billRepository from "../repositories/bill.repository";
import type {
  AppointmentRecord,
  AppointmentStatus,
  CreateAppointmentInput,
  ListAppointmentsParams,
  ListAppointmentsResult,
  PaymentStatus,
} from "../types/appointment.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

interface BilledTestLine {
  testId: string;
  testName: string;
  price: number;
}

interface Billing {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  netAmount: number;
  amountPaid: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  tests: BilledTestLine[];
}

/** Fetches the real, current tests from the existing Test catalogue and
 *  computes billing entirely server-side — a client can only choose which
 *  tests and how much was paid, never the amounts themselves. */
export async function resolveTestsAndComputeBilling(
  testIds: string[],
  discountPercent: number,
  amountPaid: number,
): Promise<Billing> {
  if (testIds.length === 0) {
    throw ApiError.badRequest("Select at least one test to continue");
  }

  const uniqueTestIds = [...new Set(testIds)];
  const tests = await testRepository.findTestsByIds(uniqueTestIds);

  if (tests.length !== uniqueTestIds.length) {
    const foundIds = new Set(tests.map((t) => t.id));
    const missing = uniqueTestIds.filter((id) => !foundIds.has(id));
    throw ApiError.badRequest("One or more selected tests do not exist", { missing });
  }

  const subtotal = tests.reduce((sum, t) => sum + Number(t.price), 0);
  const discountAmount = Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
  const netAmount = Math.round((subtotal - discountAmount) * 100) / 100;
  const dueAmount = Math.max(Math.round((netAmount - amountPaid) * 100) / 100, 0);
  const paymentStatus: PaymentStatus =
    amountPaid >= netAmount ? "PAID" : amountPaid > 0 ? "PARTIAL" : "PENDING";

  return {
    subtotal,
    discountPercent,
    discountAmount,
    netAmount,
    amountPaid,
    dueAmount,
    paymentStatus,
    tests: tests.map((t) => ({ testId: t.id, testName: t.name, price: Number(t.price) })),
  };
}

/** Prisma's "record to update not found" (P2025) becomes the same 404 a
 *  missing GET would return, instead of an unhandled 500. */
async function withNotFoundTranslation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Appointment not found");
    }
    throw error;
  }
}

/** Already Registered flow: a new visit/order for an existing patient — never
 *  creates another Patient row. */
export async function createAppointmentForPatient(
  patientId: string,
  input: CreateAppointmentInput,
  createdByUserId?: string | null,
  scopeOrganizationId?: string,
): Promise<AppointmentRecord> {
  const patient = await patientRepository.findPatientById(patientId);
  if (!patient || (scopeOrganizationId && patient.organizationId !== scopeOrganizationId)) {
    throw ApiError.notFound("Patient not found");
  }

  const billing = await resolveTestsAndComputeBilling(
    input.testIds,
    input.discountPercent ?? 0,
    input.amountPaid ?? 0,
  );

  const created = await prisma.$transaction(async (tx) => {
    const appointmentNo = await nextAppointmentNo(tx);
    const appointment = await appointmentRepository.createAppointment(
      {
        appointmentNo,
        patientId,
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
        appointmentId: appointment.id,
        patientId,
        netAmount: billing.netAmount,
        amountPaid: billing.amountPaid,
        dueAmount: billing.dueAmount,
        paymentStatus: billing.paymentStatus,
        paymentMode: input.paymentMode,
        createdByUserId,
      },
      tx,
    );

    return appointment;
  });

  return toAppointmentRecord(created);
}

export async function getAppointment(id: string): Promise<AppointmentRecord> {
  const appointment = await appointmentRepository.findAppointmentById(id);
  if (!appointment) {
    throw ApiError.notFound("Appointment not found");
  }
  return toAppointmentRecord(appointment);
}

export async function listAppointments(
  params: ListAppointmentsParams,
): Promise<ListAppointmentsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await appointmentRepository.listAppointments({
    patientId: params.patientId,
    status: params.status,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    sortBy: params.sortBy ?? "appointmentDate",
    sortDir: params.sortDir ?? "desc",
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toAppointmentRecord), total };
}

/** Patient History — a patient's full appointment list. */
export async function listAppointmentsForPatient(
  patientId: string,
  params: ListAppointmentsParams,
  scopeOrganizationId?: string,
): Promise<ListAppointmentsResult> {
  const patient = await patientRepository.findPatientById(patientId);
  if (!patient || (scopeOrganizationId && patient.organizationId !== scopeOrganizationId)) {
    throw ApiError.notFound("Patient not found");
  }
  return listAppointments({ ...params, patientId });
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<AppointmentRecord> {
  const updated = await withNotFoundTranslation(() =>
    appointmentRepository.updateAppointmentStatus(id, status),
  );
  return toAppointmentRecord(updated);
}

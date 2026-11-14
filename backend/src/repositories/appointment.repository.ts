import type { Appointment, AppointmentTest, Gender as DbGender, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { computeAge } from "./patient.repository";
import { fromDbGender, fromDbPaymentMode, toDbPaymentMode } from "../utils/enumMappers";
import type {
  AppointmentRecord,
  AppointmentStatus,
  ListAppointmentsParams,
  PaymentMode,
  PaymentStatus,
} from "../types/appointment.types";

const withTestsAndPatient = {
  tests: true,
  patient: {
    select: {
      id: true,
      patientId: true,
      firstName: true,
      lastName: true,
      mobile: true,
      gender: true,
      dob: true,
    },
  },
  center: { select: { id: true, name: true } },
} satisfies Prisma.AppointmentInclude;

type AppointmentWithRelations = Appointment & {
  tests: AppointmentTest[];
  patient?: {
    id: string;
    patientId: string;
    firstName: string;
    lastName: string;
    mobile: string;
    gender: string;
    dob: Date;
  } | null;
  center?: { id: string; name: string } | null;
};

/** Maps a Prisma row (with tests + optional patient relation loaded) to the API shape. */
export function toAppointmentRecord(appointment: AppointmentWithRelations): AppointmentRecord {
  return {
    id: appointment.id,
    appointmentNo: appointment.appointmentNo,
    patientId: appointment.patientId,
    patient: appointment.patient
      ? {
          id: appointment.patient.id,
          patientId: appointment.patient.patientId,
          fullName: `${appointment.patient.firstName} ${appointment.patient.lastName}`.trim(),
          mobile: appointment.patient.mobile,
          gender: fromDbGender(appointment.patient.gender as DbGender),
          age: computeAge(appointment.patient.dob),
        }
      : undefined,
    status: appointment.status as AppointmentStatus,
    appointmentDate: appointment.appointmentDate.toISOString(),
    subtotal: Number(appointment.subtotal),
    discountPercent: Number(appointment.discountPercent),
    discountAmount: Number(appointment.discountAmount),
    netAmount: Number(appointment.netAmount),
    paymentMode: fromDbPaymentMode(appointment.paymentMode),
    amountPaid: Number(appointment.amountPaid),
    dueAmount: Number(appointment.dueAmount),
    paymentStatus: appointment.paymentStatus as PaymentStatus,
    isEmergency: appointment.isEmergency,
    centerId: appointment.centerId,
    centerName: appointment.center?.name ?? null,
    homeCollection: appointment.homeCollection,
    tests: appointment.tests.map((t) => ({
      testId: t.testId,
      testName: t.testName,
      price: Number(t.price),
    })),
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  };
}

export interface AppointmentCreateData {
  appointmentNo: string;
  patientId: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  netAmount: number;
  paymentMode: PaymentMode;
  amountPaid: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  isEmergency?: boolean;
  centerId?: string | null;
  homeCollection?: boolean;
  createdByUserId?: string | null;
  tests: { testId: string; testName: string; price: number }[];
}

/** Appointment + its AppointmentTest rows are created together — always called
 *  from within the caller's transaction so a partial write is impossible. */
export function createAppointment(data: AppointmentCreateData, tx: Prisma.TransactionClient) {
  const { tests, paymentMode, isEmergency, centerId, homeCollection, ...appointmentFields } = data;
  return tx.appointment.create({
    data: {
      ...appointmentFields,
      paymentMode: toDbPaymentMode(paymentMode),
      isEmergency: isEmergency ?? false,
      centerId: centerId || null,
      homeCollection: homeCollection ?? false,
      tests: { create: tests },
    },
    include: withTestsAndPatient,
  });
}

export function findAppointmentById(id: string) {
  return prisma.appointment.findUnique({ where: { id }, include: withTestsAndPatient });
}

export interface ListAppointmentsFilter extends Pick<
  ListAppointmentsParams,
  "patientId" | "status" | "dateFrom" | "dateTo"
> {
  skip: number;
  take: number;
  sortBy: string;
  sortDir: "asc" | "desc";
}

const SORTABLE_FIELDS = new Set(["appointmentDate", "createdAt", "netAmount", "status"]);

function buildWhere(
  filter: Pick<ListAppointmentsFilter, "patientId" | "status" | "dateFrom" | "dateTo">,
): Prisma.AppointmentWhereInput {
  const where: Prisma.AppointmentWhereInput = {};

  if (filter.patientId) where.patientId = filter.patientId;
  if (filter.status) where.status = filter.status;
  if (filter.dateFrom || filter.dateTo) {
    where.appointmentDate = {
      ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
      ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
    };
  }

  return where;
}

export async function listAppointments(
  filter: ListAppointmentsFilter,
): Promise<{ rows: AppointmentWithRelations[]; total: number }> {
  const where = buildWhere(filter);
  const orderBy: Prisma.AppointmentOrderByWithRelationInput = SORTABLE_FIELDS.has(filter.sortBy)
    ? { [filter.sortBy]: filter.sortDir }
    : { appointmentDate: "desc" };

  const [rows, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: withTestsAndPatient,
      orderBy,
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.appointment.count({ where }),
  ]);

  return { rows, total };
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  return prisma.appointment.update({
    where: { id },
    data: { status },
    include: withTestsAndPatient,
  });
}

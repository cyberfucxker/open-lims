import type { DoctorVisit, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { DoctorVisitDto } from "../types/doctorVisit.types";

type DoctorVisitWithRelations = DoctorVisit & {
  marketingStaff: { name: string };
  referralDoctor: { doctorName: string };
};

const doctorVisitInclude = {
  marketingStaff: { select: { name: true } },
  referralDoctor: { select: { doctorName: true } },
} satisfies Prisma.DoctorVisitInclude;

export interface ListDoctorVisitsFilter {
  marketingStaffId?: string;
  referralDoctorId?: string;
  dateFrom?: string;
  dateTo?: string;
  skip: number;
  take: number;
}

export interface CreateDoctorVisitData {
  marketingStaffId: string;
  referralDoctorId: string;
  visitDate: Date;
  nextVisitDate?: Date | null;
  remarks?: string | null;
}

export function toDoctorVisitDto(visit: DoctorVisitWithRelations): DoctorVisitDto {
  return {
    id: visit.id,
    marketingStaffId: visit.marketingStaffId,
    marketingStaffName: visit.marketingStaff.name,
    referralDoctorId: visit.referralDoctorId,
    referralDoctorName: visit.referralDoctor.doctorName,
    visitDate: visit.visitDate.toISOString(),
    nextVisitDate: visit.nextVisitDate ? visit.nextVisitDate.toISOString() : null,
    remarks: visit.remarks,
    createdAt: visit.createdAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<
    ListDoctorVisitsFilter,
    "marketingStaffId" | "referralDoctorId" | "dateFrom" | "dateTo"
  >,
): Prisma.DoctorVisitWhereInput {
  const where: Prisma.DoctorVisitWhereInput = {};

  if (filter.marketingStaffId) {
    where.marketingStaffId = filter.marketingStaffId;
  }
  if (filter.referralDoctorId) {
    where.referralDoctorId = filter.referralDoctorId;
  }
  if (filter.dateFrom || filter.dateTo) {
    where.visitDate = {
      ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
      ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
    };
  }

  return where;
}

export async function listDoctorVisits(
  filter: ListDoctorVisitsFilter,
): Promise<{ rows: DoctorVisitWithRelations[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.doctorVisit.findMany({
      where,
      include: doctorVisitInclude,
      orderBy: { visitDate: "desc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.doctorVisit.count({ where }),
  ]);

  return { rows, total };
}

export function listUpcomingVisits(withinDays: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const until = new Date(today);
  until.setDate(until.getDate() + withinDays);

  return prisma.doctorVisit.findMany({
    where: { nextVisitDate: { gte: today, lte: until } },
    include: doctorVisitInclude,
    orderBy: { nextVisitDate: "asc" },
  });
}

export function createDoctorVisit(data: CreateDoctorVisitData) {
  return prisma.doctorVisit.create({
    data,
    include: doctorVisitInclude,
  });
}

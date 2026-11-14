import type { MonthlyTarget, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { MonthlyTargetDto } from "../types/monthlyTarget.types";

type MonthlyTargetWithStaff = MonthlyTarget & { marketingStaff: { name: string } };

const monthlyTargetInclude = {
  marketingStaff: { select: { name: true } },
} satisfies Prisma.MonthlyTargetInclude;

export interface UpsertMonthlyTargetData {
  marketingStaffId: string;
  month: number;
  year: number;
  revenueTarget: number;
  doctorTarget: number;
  patientTarget: number;
}

export function toMonthlyTargetDto(target: MonthlyTargetWithStaff): MonthlyTargetDto {
  return {
    id: target.id,
    marketingStaffId: target.marketingStaffId,
    marketingStaffName: target.marketingStaff.name,
    month: target.month,
    year: target.year,
    revenueTarget: Number(target.revenueTarget),
    doctorTarget: target.doctorTarget,
    patientTarget: target.patientTarget,
    createdAt: target.createdAt.toISOString(),
    updatedAt: target.updatedAt.toISOString(),
  };
}

export function upsertMonthlyTarget(data: UpsertMonthlyTargetData) {
  return prisma.monthlyTarget.upsert({
    where: {
      marketingStaffId_month_year: {
        marketingStaffId: data.marketingStaffId,
        month: data.month,
        year: data.year,
      },
    },
    create: data,
    update: {
      revenueTarget: data.revenueTarget,
      doctorTarget: data.doctorTarget,
      patientTarget: data.patientTarget,
    },
    include: monthlyTargetInclude,
  });
}

export function findMonthlyTarget(marketingStaffId: string, month: number, year: number) {
  return prisma.monthlyTarget.findUnique({
    where: { marketingStaffId_month_year: { marketingStaffId, month, year } },
    include: monthlyTargetInclude,
  });
}

export function listMonthlyTargetsForMonth(month: number, year: number) {
  return prisma.monthlyTarget.findMany({
    where: { month, year },
    include: monthlyTargetInclude,
  });
}

export function listMonthlyTargetsByStaff(marketingStaffId: string) {
  return prisma.monthlyTarget.findMany({
    where: { marketingStaffId },
    include: monthlyTargetInclude,
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

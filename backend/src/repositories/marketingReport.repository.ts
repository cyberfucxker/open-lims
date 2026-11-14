import { prisma } from "../config/database";

export interface StaffMonthlyRaw {
  id: string;
  employeeCode: string;
  name: string;
}

export interface MonthlyTargetRaw {
  marketingStaffId: string;
  revenueTarget: number;
  doctorTarget: number;
  patientTarget: number;
}

export interface BilledReferralRow {
  netAmount: number;
  patientId: string;
  referralDoctorId: string;
}

/** All non-deleted marketing staff, for the "one row per staff even with no
 *  billing activity" report shape. */
export function listAllStaffForReport(): Promise<StaffMonthlyRaw[]> {
  return prisma.marketingStaff.findMany({
    where: { deletedAt: null },
    select: { id: true, employeeCode: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** Map of referralDoctorId -> marketingStaffId for every non-deleted
 *  referral doctor, used to attribute a bill back to the owning staff
 *  member without a second query per bill. */
export async function loadDoctorToStaffMap(): Promise<Map<string, string | null>> {
  const doctors = await prisma.referralDoctor.findMany({
    where: { deletedAt: null },
    select: { id: true, marketingStaffId: true },
  });
  return new Map(doctors.map((doctor) => [doctor.id, doctor.marketingStaffId]));
}

/** Every ACTIVE bill created within [monthStart, monthEndExclusive) whose
 *  patient carries a referralDoctorId — the raw rows the report/leaderboard/
 *  commission math reduces over in application code. */
export async function listBilledReferralsForMonth(
  monthStart: Date,
  monthEndExclusive: Date,
): Promise<BilledReferralRow[]> {
  const bills = await prisma.bill.findMany({
    where: {
      status: "ACTIVE",
      createdAt: { gte: monthStart, lt: monthEndExclusive },
      appointment: { patient: { referralDoctorId: { not: null } } },
    },
    select: {
      netAmount: true,
      appointment: {
        select: {
          patient: { select: { id: true, referralDoctorId: true } },
        },
      },
    },
  });

  return bills
    .filter((bill) => bill.appointment.patient.referralDoctorId !== null)
    .map((bill) => ({
      netAmount: Number(bill.netAmount),
      patientId: bill.appointment.patient.id,
      referralDoctorId: bill.appointment.patient.referralDoctorId as string,
    }));
}

export async function listTargetsForMonth(
  month: number,
  year: number,
): Promise<MonthlyTargetRaw[]> {
  const targets = await prisma.monthlyTarget.findMany({
    where: { month, year },
    select: {
      marketingStaffId: true,
      revenueTarget: true,
      doctorTarget: true,
      patientTarget: true,
    },
  });
  return targets.map((target) => ({
    marketingStaffId: target.marketingStaffId,
    revenueTarget: Number(target.revenueTarget),
    doctorTarget: target.doctorTarget,
    patientTarget: target.patientTarget,
  }));
}

export function countActiveMarketingStaff() {
  return prisma.marketingStaff.count({ where: { deletedAt: null, status: true } });
}

export function countActiveReferralDoctors() {
  return prisma.referralDoctor.count({ where: { deletedAt: null, status: true } });
}

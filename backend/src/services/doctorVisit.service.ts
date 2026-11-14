import { ApiError } from "../utils/ApiError";
import * as doctorVisitRepository from "../repositories/doctorVisit.repository";
import { toDoctorVisitDto } from "../repositories/doctorVisit.repository";
import { assertMarketingStaffExists } from "./marketingStaff.service";
import * as referralDoctorRepository from "../repositories/referralDoctor.repository";
import type {
  CreateDoctorVisitInput,
  DoctorVisitDto,
  ListDoctorVisitsParams,
  ListDoctorVisitsResult,
} from "../types/doctorVisit.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

async function assertReferralDoctorExists(referralDoctorId: string): Promise<void> {
  const doctor = await referralDoctorRepository.findReferralDoctorById(referralDoctorId);
  if (!doctor) {
    throw ApiError.badRequest("Selected referral doctor does not exist");
  }
}

export async function recordVisit(values: CreateDoctorVisitInput): Promise<DoctorVisitDto> {
  await assertMarketingStaffExists(values.marketingStaffId);
  await assertReferralDoctorExists(values.referralDoctorId);

  const visit = await doctorVisitRepository.createDoctorVisit({
    marketingStaffId: values.marketingStaffId,
    referralDoctorId: values.referralDoctorId,
    visitDate: new Date(values.visitDate),
    nextVisitDate: values.nextVisitDate ? new Date(values.nextVisitDate) : null,
    remarks: values.remarks,
  });

  return toDoctorVisitDto(visit);
}

export async function listVisits(params: ListDoctorVisitsParams): Promise<ListDoctorVisitsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await doctorVisitRepository.listDoctorVisits({
    marketingStaffId: params.marketingStaffId,
    referralDoctorId: params.referralDoctorId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toDoctorVisitDto), total };
}

export async function listUpcomingVisits(withinDays: number): Promise<DoctorVisitDto[]> {
  const visits = await doctorVisitRepository.listUpcomingVisits(withinDays);
  return visits.map(toDoctorVisitDto);
}

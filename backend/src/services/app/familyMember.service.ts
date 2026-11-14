import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { fromDbGender, toRelationLabel } from "../../utils/enumMappers";
import { computeAge } from "../../repositories/patient.repository";
import { formatDDMMYYYY, parseDDMMYYYY, toISODateString } from "../../utils/app/date.util";
import { createLinkedPatient } from "./patientLink.service";
import type { Gender } from "../../types/patient.types";
import type { FamilyMemberRelation } from "@prisma/client";

function toDbRelation(relation: string): FamilyMemberRelation {
  return relation.toUpperCase() as FamilyMemberRelation;
}

export interface FamilyMemberResult {
  id: string;
  name: string;
  mobile_no: string;
  email: string | null;
  dob: string;
  age: number;
  relation: string;
  gender: string;
  upload_doc: string | null;
  user_id: string;
}

function toResult(row: {
  id: string;
  appUserId: string;
  relation: FamilyMemberRelation;
  uploadDocUrl: string | null;
  patient: {
    firstName: string;
    lastName: string;
    mobile: string;
    email: string | null;
    dob: Date;
    gender: "MALE" | "FEMALE" | "OTHER";
  };
}): FamilyMemberResult {
  return {
    id: row.id,
    name: [row.patient.firstName, row.patient.lastName].filter(Boolean).join(" "),
    mobile_no: row.patient.mobile,
    email: row.patient.email,
    dob: formatDDMMYYYY(row.patient.dob),
    age: computeAge(row.patient.dob),
    relation: toRelationLabel(row.relation),
    gender: fromDbGender(row.patient.gender),
    upload_doc: row.uploadDocUrl,
    user_id: row.appUserId,
  };
}

export async function listFamilyMembers(appUserId: string): Promise<FamilyMemberResult[]> {
  const rows = await prisma.familyMember.findMany({
    where: { appUserId },
    include: { patient: true },
    orderBy: { createdAt: "asc" },
  });

  return rows.map(toResult);
}

/** The list screen also renders a city dropdown (see api.md's noted
 *  duplication of city payloads across modules — Verify OTP uses a
 *  differently-shaped one, flagged there for a future consolidation onto a
 *  single `/master/cities` endpoint). */
export async function listFamilyMembersWithCities(appUserId: string): Promise<{
  familyMembers: FamilyMemberResult[];
  cities: Array<{ id: string; city: string; slug: string }>;
}> {
  const [familyMembers, cityRows] = await Promise.all([
    listFamilyMembers(appUserId),
    prisma.city.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    familyMembers,
    cities: cityRows.map((c) => ({ id: c.id, city: c.name, slug: c.slug })),
  };
}

export interface AddFamilyMemberInput {
  name: string;
  /** Optional — a family member with no phone of their own falls back to
   *  the account holder's own mobile (see below). */
  mobile_no?: string;
  email?: string;
  /** Either this or `age` is required (enforced in
   *  `familyMember.validation.ts`) — `age` alone is converted to an
   *  approximate dob below since `Patient.dob` is NOT NULL. */
  dob?: string;
  age?: number;
  relation: string;
  gender: Gender;
}

/** `Patient.dob` has no "age only" concept, so a bare age is converted to
 *  Jan 1 of the implied birth year — accurate to within a few months, which
 *  is the same precision an age-only entry ever had anyway. Computed in UTC,
 *  same convention as `date.util.ts#parseDDMMYYYY`. */
function approximateDobFromAge(age: number): Date {
  const currentYear = new Date().getUTCFullYear();
  return new Date(Date.UTC(currentYear - age, 0, 1));
}

export async function addFamilyMember(
  appUserId: string,
  input: AddFamilyMemberInput,
  uploadDocUrl: string | null,
): Promise<FamilyMemberResult> {
  const dob = input.dob ? parseDDMMYYYY(input.dob) : approximateDobFromAge(input.age!);

  const created = await prisma.$transaction(async (tx) => {
    // No phone of their own (common for a young child/elderly parent) —
    // fall back to the account holder's own mobile rather than requiring a
    // second real number nobody has to give. `Patient.mobile` has no unique
    // constraint, so more than one Patient row sharing a number is fine.
    const mobile =
      input.mobile_no || (await tx.appUser.findUniqueOrThrow({ where: { id: appUserId } })).mobile;

    const patient = await createLinkedPatient(
      {
        fullName: input.name,
        gender: input.gender,
        dob: toISODateString(dob),
        mobile,
        email: input.email,
      },
      tx,
    );

    return tx.familyMember.create({
      data: {
        appUserId,
        patientId: patient.id,
        relation: toDbRelation(input.relation),
        uploadDocUrl,
      },
      include: { patient: true },
    });
  });

  return toResult(created);
}

export async function deleteFamilyMember(appUserId: string, memberId: string): Promise<void> {
  const member = await prisma.familyMember.findUnique({ where: { id: memberId } });

  if (!member || member.appUserId !== appUserId) {
    throw ApiError.notFound("Family member not found");
  }

  if (member.relation === "SELF") {
    throw ApiError.forbidden("The account holder's own record cannot be removed");
  }

  const hasOrders = await prisma.appOrderAppointment.findFirst({
    where: { familyMemberId: memberId },
  });
  if (hasOrders) {
    throw ApiError.conflict("This family member has existing orders and cannot be removed");
  }

  await prisma.familyMember.delete({ where: { id: memberId } });
}

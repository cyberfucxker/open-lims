import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";

function relationLabel(relation: string): string {
  return relation.charAt(0) + relation.slice(1).toLowerCase();
}

export async function listPrescriptions(appUserId: string) {
  const rows = await prisma.prescription.findMany({
    where: { appUserId, deletedAt: null },
    include: { familyMember: { include: { patient: true } }, city: true },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.familyMember
      ? `${row.familyMember.patient.firstName} ${row.familyMember.patient.lastName}`.trim()
      : null,
    phone: row.familyMember?.patient.mobile ?? null,
    relation: row.familyMember ? relationLabel(row.familyMember.relation) : null,
    city: row.city ? { id: row.city.id, name: row.city.name } : null,
    query: row.query,
    file_url: row.fileUrl,
    status: row.status,
    created_at: row.createdAt.toISOString(),
  }));
}

export interface SubmitPrescriptionInput {
  family_member_id: string;
  city_id: string;
  query?: string;
}

export async function submitPrescription(
  appUserId: string,
  input: SubmitPrescriptionInput,
  fileUrl: string,
) {
  const [familyMember, city] = await Promise.all([
    prisma.familyMember.findUnique({ where: { id: input.family_member_id } }),
    prisma.city.findUnique({ where: { id: input.city_id } }),
  ]);

  if (!familyMember || familyMember.appUserId !== appUserId) {
    throw ApiError.notFound("Family member not found");
  }
  if (!city) {
    throw ApiError.badRequest("Unknown city");
  }

  await prisma.prescription.create({
    data: {
      appUserId,
      familyMemberId: familyMember.id,
      cityId: city.id,
      query: input.query || null,
      fileUrl,
    },
  });
}

export async function deletePrescription(appUserId: string, prescriptionId: string): Promise<void> {
  const prescription = await prisma.prescription.findUnique({ where: { id: prescriptionId } });
  if (!prescription || prescription.appUserId !== appUserId || prescription.deletedAt) {
    throw ApiError.notFound("Prescription not found");
  }

  await prisma.prescription.update({
    where: { id: prescriptionId },
    data: { deletedAt: new Date() },
  });
}

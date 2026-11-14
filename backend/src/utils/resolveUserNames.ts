import { prisma } from "../config/database";

/**
 * Batched username/fullName lookup for the many `*ByUserId` audit columns
 * (Bill.createdByUserId, Sample.collectedByUserId/receivedByUserId,
 * Report.enteredByUserId/approvedByUserId, ...) that are kept as plain uuid
 * columns rather than Prisma relations — same reasoning as
 * `Appointment.createdByUserId`. One query per call site instead of a
 * per-row lookup.
 */
export async function resolveUserNames(
  ids: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (uniqueIds.length === 0) return new Map();

  const users = await prisma.user.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, username: true, fullName: true },
  });

  return new Map(users.map((u) => [u.id, u.fullName || u.username]));
}

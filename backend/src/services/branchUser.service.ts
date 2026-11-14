import { prisma } from "../config/database";

/** Read-only list of branch logins, for the Test form's "Branch User" picker.
 *
 *  Deliberately NOT a user-management module: there is no staff-user CRUD API in
 *  this project, and adding one to populate a dropdown would be far more surface
 *  than the feature needs. This exposes exactly the fields the picker renders and
 *  nothing else — no password hashes, no login history, no mutations.
 *
 *  "Branch user" means a FRANCHISE-role `User`, which is the
 *  collection-center/branch portal login (1:1 with an `Organization`, see
 *  `User.organizationId`). The role is matched by name because roles live in a
 *  table rather than an enum. */

export interface BranchUserDto {
  id: string;
  username: string;
  fullName: string | null;
  /** The organization this login belongs to, when it has one. */
  organizationName: string | null;
  isActive: boolean;
}

export const BRANCH_USER_ROLE = "FRANCHISE";

export async function listBranchUsers(search?: string): Promise<BranchUserDto[]> {
  const users = await prisma.user.findMany({
    where: {
      role: { name: BRANCH_USER_ROLE },
      isActive: true,
      ...(search
        ? {
            OR: [
              { username: { contains: search, mode: "insensitive" as const } },
              { fullName: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      username: true,
      fullName: true,
      isActive: true,
      organization: { select: { name: true } },
    },
    orderBy: [{ fullName: "asc" }, { username: "asc" }],
  });

  return users.map((user) => ({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    organizationName: user.organization?.name ?? null,
    isActive: user.isActive,
  }));
}

/** Rejects ids that aren't usable branch logins, so a stale or hand-crafted
 *  payload can't attach a Test to an ADMIN account or a deactivated login. */
export async function findUnusableBranchUserIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const usable = await prisma.user.findMany({
    where: { id: { in: ids }, isActive: true, role: { name: BRANCH_USER_ROLE } },
    select: { id: true },
  });
  const usableIds = new Set(usable.map((u) => u.id));
  return ids.filter((id) => !usableIds.has(id));
}

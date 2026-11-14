import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { parseStaffModules, type StaffModule } from "../middleware/staffModule.middleware";
import * as authRepository from "../repositories/auth.repository";
import { ApiError } from "../utils/ApiError";
import { hashPassword } from "../utils/password.util";

/**
 * Superadmin "Team" — the ADMIN's own logins plus MANAGER logins scoped to a
 * set of modules. Only MANAGER rows are editable here: the ADMIN account is
 * listed for visibility but changed only through its own Username & Password
 * page, so an admin can't lock themselves out from this screen.
 */

export interface StaffUserDto {
  id: string;
  username: string;
  fullName: string | null;
  role: string;
  staffModules: StaffModule[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const staffSelect = {
  id: true,
  username: true,
  fullName: true,
  isActive: true,
  staffModules: true,
  lastLoginAt: true,
  createdAt: true,
  role: { select: { name: true } },
} satisfies Prisma.UserSelect;

type StaffRow = Prisma.UserGetPayload<{ select: typeof staffSelect }>;

function toDto(row: StaffRow): StaffUserDto {
  return {
    id: row.id,
    username: row.username,
    fullName: row.fullName,
    role: row.role.name,
    staffModules: row.role.name === "MANAGER" ? parseStaffModules(row.staffModules) : [],
    isActive: row.isActive,
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listStaffUsers(): Promise<StaffUserDto[]> {
  const rows = await prisma.user.findMany({
    where: { role: { name: { in: ["ADMIN", "MANAGER"] } } },
    select: staffSelect,
    orderBy: [{ createdAt: "asc" }],
  });
  return rows.map(toDto);
}

async function findManager(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: staffSelect });
  if (!user || user.role.name !== "MANAGER") {
    throw ApiError.notFound("Manager not found");
  }
  return user;
}

export async function createManager(input: {
  username: string;
  fullName: string;
  password: string;
  staffModules: StaffModule[];
}): Promise<StaffUserDto> {
  const role = await prisma.role.findUnique({ where: { name: "MANAGER" } });
  if (!role) {
    throw ApiError.internal("MANAGER role is missing — run the latest migration");
  }
  if (await authRepository.findUserByUsername(input.username)) {
    throw ApiError.conflict("This username is already taken");
  }

  try {
    const row = await prisma.user.create({
      data: {
        username: input.username,
        fullName: input.fullName,
        passwordHash: await hashPassword(input.password),
        roleId: role.id,
        staffModules: input.staffModules,
        isActive: true,
      },
      select: staffSelect,
    });
    return toDto(row);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw ApiError.conflict("This username is already taken");
    }
    throw error;
  }
}

export async function updateManager(
  id: string,
  input: { fullName?: string; staffModules?: StaffModule[]; isActive?: boolean },
): Promise<StaffUserDto> {
  await findManager(id);
  const row = await prisma.user.update({
    where: { id },
    data: {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.staffModules !== undefined ? { staffModules: input.staffModules } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    select: staffSelect,
  });
  // A deactivated manager must not be able to mint new access tokens.
  if (input.isActive === false) {
    await authRepository.revokeAllUserRefreshTokens(id);
  }
  return toDto(row);
}

/** Admin-set password (the manager forgot theirs). Signs them out everywhere. */
export async function resetManagerPassword(id: string, password: string): Promise<void> {
  await findManager(id);
  await authRepository.updateUserPassword(id, await hashPassword(password));
  await authRepository.revokeAllUserRefreshTokens(id);
}

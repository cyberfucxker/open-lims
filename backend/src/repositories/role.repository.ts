import type { Role } from "@prisma/client";
import { prisma } from "../config/database";
import type { RoleDto } from "../types/role.types";

export function toRoleDto(role: Role): RoleDto {
  return { id: role.id, name: role.name, label: role.label };
}

export function listRoles() {
  return prisma.role.findMany({ orderBy: { label: "asc" } });
}

export function findRoleById(id: string) {
  return prisma.role.findUnique({ where: { id } });
}

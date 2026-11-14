import * as roleRepository from "../repositories/role.repository";
import { toRoleDto } from "../repositories/role.repository";
import type { RoleDto } from "../types/role.types";

export async function listRoles(): Promise<RoleDto[]> {
  const roles = await roleRepository.listRoles();
  return roles.map(toRoleDto);
}

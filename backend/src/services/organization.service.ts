import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { hashPassword } from "../utils/password.util";
import { nextOrganizationCode } from "../utils/idGenerator";
import { deriveFranchiseCodeBase, pickAvailableCode } from "../utils/franchiseCode";
import * as organizationRepository from "../repositories/organization.repository";
import { toOrganizationDto } from "../repositories/organization.repository";
import * as areaRepository from "../repositories/area.repository";
import * as roleRepository from "../repositories/role.repository";
import * as authRepository from "../repositories/auth.repository";
import { SEED_ROLES } from "../constants/roles.constants";
import {
  ORGANIZATION_MODULES,
  type CreateOrganizationData,
  type EnableLoginInput,
  type ListOrganizationsParams,
  type ListOrganizationsResult,
  type OrganizationAuditLogDto,
  type OrganizationServiceAreaDto,
  type OrganizationDto,
  type OrganizationModule,
  type OrganizationWriteData,
  type UpdateLoginInput,
} from "../types/organization.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Organization not found");
      }
      if (error.code === "P2002") {
        const target = (error.meta?.target as string[] | undefined)?.join(",") ?? "";
        if (target.includes("username")) {
          throw ApiError.conflict("This username is already taken");
        }
        throw ApiError.conflict("An organization with this code already exists");
      }
    }
    throw error;
  }
}

export async function listOrganizations(
  params: ListOrganizationsParams,
): Promise<ListOrganizationsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const sharedFilter = {
    search: params.search,
    type: params.type,
    franchiseType: params.franchiseType,
    active: params.active,
    includeDeleted: params.includeDeleted === "true",
    priceListId: params.priceListId,
    cityId: params.cityId,
  };

  const [{ rows, total }, allMatchingIds] = await Promise.all([
    organizationRepository.listOrganizations({
      ...sharedFilter,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    organizationRepository.listMatchingOrgIds(sharedFilter),
  ]);

  const metricsById = await organizationRepository.getOrgMetrics(allMatchingIds.map((o) => o.id));
  let totalOrderVolume = 0;
  let totalSettlementDue = 0;
  for (const metrics of metricsById.values()) {
    totalOrderVolume += metrics.orderCount;
    totalSettlementDue += metrics.settlementDue;
  }

  return {
    rows: rows.map((r) => toOrganizationDto(r, metricsById.get(r.id))),
    total,
    totalOrderVolume,
    totalSettlementDue,
  };
}

export async function listAllOrganizationsForExport(
  params: Pick<ListOrganizationsParams, "search" | "type" | "active" | "includeDeleted">,
): Promise<OrganizationDto[]> {
  const rows = await organizationRepository.listAllOrganizationsForExport({
    search: params.search,
    type: params.type,
    active: params.active,
    includeDeleted: params.includeDeleted === "true",
  });
  return rows.map((r) => toOrganizationDto(r));
}

export async function getOrganization(id: string): Promise<OrganizationDto> {
  const organization = await organizationRepository.findOrganizationById(id);
  if (!organization) {
    throw ApiError.notFound("Organization not found");
  }
  const metricsById = await organizationRepository.getOrgMetrics([id]);
  return toOrganizationDto(organization, metricsById.get(id));
}

export async function getMyOrganization(organizationId: string): Promise<OrganizationDto> {
  const organization =
    await organizationRepository.findOrganizationByIdIncludingDeleted(organizationId);
  if (!organization || organization.deletedAt) {
    throw ApiError.notFound("Organization not found");
  }
  return toOrganizationDto(organization);
}

/** Franchise portal logins are always this role — the caller does not get to
 *  choose, unlike the older `enableLogin` flow which takes an arbitrary
 *  `roleId`. Looked up by name because roles live in a table, not an enum. */
const FRANCHISE_ROLE_NAME = SEED_ROLES.FRANCHISE.name;

/** A franchise created with a login gets the full LIMS Collection Center module
 *  set. The previous Superadmin flow sent the organization's `enabledModules`
 *  when creating a login, which for a brand-new organization is always `[]` —
 *  producing a login that could authenticate but saw an empty portal and got a
 *  403 from every module route. */
const DEFAULT_FRANCHISE_MODULES: OrganizationModule[] = [...ORGANIZATION_MODULES];

/** Mints the franchise's code inside the creating transaction.
 *
 *  Prefers a name-derived code ("Example Diagnostics Lab Jaipur" -> "RDJ") and
 *  falls back to the ORG###### sequence when the name yields nothing usable
 *  (no Latin alphanumerics) or when every suffix for that base is taken. */
async function mintFranchiseCode(name: string, tx: Prisma.TransactionClient): Promise<string> {
  const base = deriveFranchiseCodeBase(name);
  if (base) {
    const taken = await organizationRepository.listCodesStartingWith(base, tx);
    const derived = pickAvailableCode(base, taken);
    if (derived) return derived;
  }
  return nextOrganizationCode(tx);
}

/** A franchise onboarded from Superadmin is a collection center — the form does
 *  not ask, because the Single Lab / Co-Lab choice it *does* ask is about
 *  branding, not center type. The LIMS organization form still sends `type`
 *  explicitly and is unaffected. */
const DEFAULT_ORGANIZATION_TYPE = "COLLECTION_CENTER" as const;

/** Keeps the denormalised `city` name in step with `cityId`. LIMS lists and
 *  filters on the name column, so a franchise created from Superadmin's city
 *  dropdown has to populate both or it goes missing from those screens. */
async function withResolvedCity<T extends { cityId?: string | null; city?: string | null }>(
  values: T,
): Promise<T> {
  if (!values.cityId) return values;

  const city = await organizationRepository.findCityById(values.cityId);
  if (!city) {
    throw ApiError.badRequest("Selected city does not exist");
  }
  return { ...values, city: city.name };
}

export async function createOrganization(
  values: CreateOrganizationData,
  createdByUserId?: string | null,
): Promise<OrganizationDto> {
  const { username, password, ...rest } = values;
  const organizationValues = await withResolvedCity({
    ...rest,
    type: rest.type ?? DEFAULT_ORGANIZATION_TYPE,
  });

  // Both or neither: a username with no password (or the reverse) is a
  // half-filled form, not a request to skip login creation.
  if ((username && !password) || (!username && password)) {
    throw ApiError.badRequest(
      "Both username and password are required to create a franchise login",
    );
  }

  let login: organizationRepository.OrganizationLoginSeed | undefined;
  if (username && password) {
    const role = await authRepository.findRoleByName(FRANCHISE_ROLE_NAME);
    if (!role) {
      throw ApiError.badRequest(
        `The ${FRANCHISE_ROLE_NAME} role is missing — run the database seed before onboarding franchises`,
      );
    }
    login = {
      username,
      passwordHash: await hashPassword(password),
      roleId: role.id,
      enabledModules: DEFAULT_FRANCHISE_MODULES,
    };
  }

  const organization = await withTranslatedErrors(() =>
    organizationRepository.createOrganizationWithLogin(
      { ...organizationValues, createdByUserId },
      (tx) => mintFranchiseCode(organizationValues.name, tx),
      login,
    ),
  );

  await organizationRepository.createAuditLog(organization.id, "CREATED", createdByUserId);
  if (login) {
    await organizationRepository.createAuditLog(
      organization.id,
      "LOGIN_ENABLED",
      createdByUserId,
      `username: ${login.username}`,
    );
  }

  return toOrganizationDto(organization);
}

export async function updateOrganization(
  id: string,
  values: OrganizationWriteData,
  performedByUserId?: string | null,
): Promise<OrganizationDto> {
  const current = await getOrganization(id);

  const resolved = await withResolvedCity({
    ...values,
    type: values.type ?? DEFAULT_ORGANIZATION_TYPE,
  });

  // `priceListId` on an update names a TEMPLATE to re-clone from, exactly as it
  // does on create — never a list to point at directly. Held back from the
  // plain update and routed through `reassignPriceList` when it actually
  // changes, so a no-op save of the rest of the form does not silently discard
  // the franchise's own price edits.
  const { priceListId: priceListTemplateId, ...updatable } = resolved;
  const templateChanged =
    priceListTemplateId != null && priceListTemplateId !== current.priceListTemplateId;

  const organization = await withTranslatedErrors(() =>
    organizationRepository.updateOrganization(id, updatable),
  );

  await organizationRepository.createAuditLog(id, "UPDATED", performedByUserId);

  if (!templateChanged) {
    return toOrganizationDto(organization);
  }

  await organizationRepository.reassignPriceList(id, priceListTemplateId, current.code);
  await organizationRepository.createAuditLog(
    id,
    "PRICE_LIST_ASSIGNED",
    performedByUserId,
    `template: ${priceListTemplateId}`,
  );
  // Re-read: `organization` above predates the clone, so its priceList relation
  // still points at whatever the franchise was on before.
  return getOrganization(id);
}

export async function deleteOrganization(
  id: string,
  performedByUserId?: string | null,
): Promise<void> {
  await withTranslatedErrors(() => organizationRepository.softDeleteOrganization(id));

  const loginUser = await organizationRepository.findLoginUserByOrganizationId(id);
  if (loginUser?.isActive) {
    await organizationRepository.updateLoginUser(loginUser.id, { isActive: false });
  }

  await organizationRepository.createAuditLog(id, "DELETED", performedByUserId);
}

export async function restoreOrganization(
  id: string,
  performedByUserId?: string | null,
): Promise<OrganizationDto> {
  const organization = await withTranslatedErrors(() =>
    organizationRepository.restoreOrganization(id),
  );
  await organizationRepository.createAuditLog(id, "RESTORED", performedByUserId);
  return toOrganizationDto(organization);
}

export async function setOrganizationStatus(
  id: string,
  active: boolean,
  performedByUserId?: string | null,
): Promise<OrganizationDto> {
  const organization = await withTranslatedErrors(() =>
    organizationRepository.setOrganizationStatus(id, active),
  );
  await organizationRepository.createAuditLog(
    id,
    "STATUS_CHANGED",
    performedByUserId,
    active ? "Activated" : "Deactivated",
  );
  return toOrganizationDto(organization);
}

async function assertRoleExists(roleId: string) {
  const role = await roleRepository.findRoleById(roleId);
  if (!role) {
    throw ApiError.badRequest("Selected role does not exist");
  }
  return role;
}

export async function enableLogin(
  id: string,
  input: EnableLoginInput,
  performedByUserId?: string | null,
): Promise<OrganizationDto> {
  const organization = await getOrganization(id);

  const existingLogin = await organizationRepository.findLoginUserByOrganizationId(id);
  if (existingLogin) {
    throw ApiError.conflict(
      "This organization already has a login. Use update or disable instead.",
    );
  }

  await assertRoleExists(input.roleId);

  const passwordHash = await hashPassword(input.password);
  await withTranslatedErrors(() =>
    organizationRepository.createLoginUser({
      organizationId: id,
      username: input.username,
      passwordHash,
      roleId: input.roleId,
      fullName: organization.name,
    }),
  );

  await organizationRepository.setOrganizationLoginEnabled(id, true);
  const updated = await organizationRepository.setOrganizationEnabledModules(
    id,
    input.enabledModules,
  );

  await organizationRepository.createAuditLog(
    id,
    "LOGIN_ENABLED",
    performedByUserId,
    `username: ${input.username}`,
  );

  return toOrganizationDto(updated);
}

export async function updateLogin(
  id: string,
  input: UpdateLoginInput,
  performedByUserId?: string | null,
): Promise<OrganizationDto> {
  await getOrganization(id);

  const loginUser = await organizationRepository.findLoginUserByOrganizationId(id);
  if (!loginUser) {
    throw ApiError.notFound("No login exists for this organization yet");
  }

  if (input.roleId) {
    await assertRoleExists(input.roleId);
  }

  const passwordHash = input.password ? await hashPassword(input.password) : undefined;

  if (input.roleId || input.isActive !== undefined || passwordHash) {
    await withTranslatedErrors(() =>
      organizationRepository.updateLoginUser(loginUser.id, {
        roleId: input.roleId,
        isActive: input.isActive,
        passwordHash,
      }),
    );
  }

  if (input.enabledModules) {
    await organizationRepository.setOrganizationEnabledModules(id, input.enabledModules);
  }

  const updated = await organizationRepository.findOrganizationById(id);
  await organizationRepository.createAuditLog(id, "LOGIN_UPDATED", performedByUserId);

  return toOrganizationDto(updated!);
}

export async function disableLogin(
  id: string,
  performedByUserId?: string | null,
): Promise<OrganizationDto> {
  await getOrganization(id);

  const loginUser = await organizationRepository.findLoginUserByOrganizationId(id);
  if (!loginUser) {
    throw ApiError.notFound("No login exists for this organization");
  }

  await organizationRepository.updateLoginUser(loginUser.id, { isActive: false });
  const updated = await organizationRepository.setOrganizationLoginEnabled(id, false);

  await organizationRepository.createAuditLog(id, "LOGIN_DISABLED", performedByUserId);

  return toOrganizationDto(updated);
}

export async function listAuditLogs(id: string): Promise<OrganizationAuditLogDto[]> {
  await getOrganization(id);
  const logs = await organizationRepository.listAuditLogs(id);
  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    performedByUserId: log.performedByUserId,
    note: log.note,
    createdAt: log.createdAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Service areas — see `OrganizationServiceArea`'s doc-comment in schema.prisma
// and `franchiseOrderScope.ts` for why this exists (order visibility for a
// franchise is these areas, not just its `cityId`).
// ---------------------------------------------------------------------------

export async function getOrganizationServiceAreas(
  id: string,
): Promise<OrganizationServiceAreaDto[]> {
  await getOrganization(id);
  const rows = await organizationRepository.listServiceAreas(id);
  return rows.map((row) => ({
    id: row.area.id,
    name: row.area.name,
    cityId: row.area.cityId,
    cityName: row.area.city.name,
  }));
}

export async function setOrganizationServiceAreas(
  id: string,
  areaIds: string[],
  performedByUserId?: string | null,
): Promise<OrganizationServiceAreaDto[]> {
  await getOrganization(id);

  const uniqueAreaIds = [...new Set(areaIds)];
  if (uniqueAreaIds.length > 0) {
    const found = await areaRepository.countAreasByIds(uniqueAreaIds);
    if (found !== uniqueAreaIds.length) {
      throw ApiError.badRequest("One or more selected areas do not exist");
    }
  }

  await organizationRepository.replaceServiceAreas(id, uniqueAreaIds);
  await organizationRepository.createAuditLog(id, "SERVICE_AREAS_UPDATED", performedByUserId);

  return getOrganizationServiceAreas(id);
}

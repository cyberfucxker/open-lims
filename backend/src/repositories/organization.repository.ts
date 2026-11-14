import type {
  City,
  Organization,
  PriceList,
  PriceListItemType,
  Prisma,
  Role,
  User,
} from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import type {
  DeliveryChannel,
  FranchiseType,
  OrganizationDto,
  OrganizationModule,
  OrganizationType,
  OrgPaymentType,
} from "../types/organization.types";

type OrganizationWithRelations = Organization & {
  priceList: PriceList | null;
  users: (User & { role: Role })[];
  cityRef: City | null;
};

const organizationInclude = {
  priceList: true,
  users: { include: { role: true } },
  cityRef: true,
} satisfies Prisma.OrganizationInclude;

export interface ListOrganizationsFilter {
  search?: string;
  type?: OrganizationType;
  franchiseType?: FranchiseType;
  active?: string;
  includeDeleted?: boolean;
  priceListId?: string;
  cityId?: string;
  sortBy?: string;
  sortDir?: string;
  skip: number;
  take: number;
}

export interface OrganizationWriteInput {
  name: string;
  type: OrganizationType;
  contactPerson?: string | null;
  mobile: string;
  email?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  cityId?: string | null;
  pincode?: string | null;
  address?: string | null;
  description?: string | null;
  franchiseType?: FranchiseType;
  labName?: string | null;
  labLogoPath?: string | null;
  priceListId?: string | null;
  paymentType?: OrgPaymentType;
  creditLimit?: number;
  advanceAmount?: number;
  dueDays?: number;
  source?: string | null;
  billingRules?: string | null;
  invoiceRules?: string | null;
  reportDeliveryChannels?: DeliveryChannel[];
  billDeliveryChannels?: DeliveryChannel[];
  commissionPct?: number;
  active?: boolean;
  createdByUserId?: string | null;
}

const SORTABLE_FIELDS = new Set(["name", "code", "type", "active", "createdAt", "updatedAt"]);

export interface OrgMetrics {
  orderCount: number;
  settlementDue: number;
}

export function toOrganizationDto(
  organization: OrganizationWithRelations,
  metrics?: OrgMetrics,
): OrganizationDto {
  const loginUser = organization.users[0] ?? null;

  return {
    id: organization.id,
    code: organization.code,
    name: organization.name,
    type: organization.type,
    contactPerson: organization.contactPerson,
    mobile: organization.mobile,
    email: organization.email,
    country: organization.country,
    state: organization.state,
    city: organization.city,
    cityId: organization.cityId,
    cityName: organization.cityRef?.name ?? organization.city,
    pincode: organization.pincode,
    address: organization.address,
    description: organization.description,

    franchiseType: organization.franchiseType,
    labName: organization.labName,
    labLogoPath: organization.labLogoPath,

    priceListId: organization.priceListId,
    priceListName: organization.priceList?.name ?? null,
    priceListTemplateId: organization.priceList?.templateId ?? null,
    paymentType: organization.paymentType,
    creditLimit: Number(organization.creditLimit),
    advanceAmount: Number(organization.advanceAmount),
    dueDays: organization.dueDays,
    source: organization.source,
    billingRules: organization.billingRules,
    invoiceRules: organization.invoiceRules,
    reportDeliveryChannels: organization.reportDeliveryChannels as unknown as DeliveryChannel[],
    billDeliveryChannels: organization.billDeliveryChannels as unknown as DeliveryChannel[],

    loginEnabled: organization.loginEnabled,
    enabledModules: organization.enabledModules as unknown as OrganizationModule[],
    login: loginUser
      ? {
          userId: loginUser.id,
          username: loginUser.username,
          isActive: loginUser.isActive,
          roleId: loginUser.roleId,
          roleName: loginUser.role.name,
        }
      : null,

    commissionPct: Number(organization.commissionPct),
    orderCount: metrics?.orderCount ?? 0,
    settlementDue: metrics?.settlementDue ?? 0,

    active: organization.active,
    deletedAt: organization.deletedAt ? organization.deletedAt.toISOString() : null,
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString(),
  };
}

export function buildWhere(
  filter: Pick<
    ListOrganizationsFilter,
    "search" | "type" | "franchiseType" | "active" | "includeDeleted" | "priceListId" | "cityId"
  >,
): Prisma.OrganizationWhereInput {
  const where: Prisma.OrganizationWhereInput = {};

  if (!filter.includeDeleted) {
    where.deletedAt = null;
  }
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { code: { contains: filter.search, mode: "insensitive" } },
      { contactPerson: { contains: filter.search, mode: "insensitive" } },
      { mobile: { contains: filter.search } },
      { email: { contains: filter.search, mode: "insensitive" } },
      { city: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter.type) {
    where.type = filter.type;
  }
  if (filter.franchiseType) {
    where.franchiseType = filter.franchiseType;
  }
  if (filter.priceListId) {
    where.priceListId = filter.priceListId;
  }
  if (filter.cityId) {
    where.cityId = filter.cityId;
  }
  if (filter.active === "true") {
    where.active = true;
  } else if (filter.active === "false") {
    where.active = false;
  }

  return where;
}

function buildOrderBy(
  sortBy?: string,
  sortDir?: string,
): Prisma.OrganizationOrderByWithRelationInput {
  const field = sortBy && SORTABLE_FIELDS.has(sortBy) ? sortBy : "createdAt";
  return { [field]: sortDir === "asc" ? "asc" : "desc" };
}

export async function listOrganizations(
  filter: ListOrganizationsFilter,
): Promise<{ rows: OrganizationWithRelations[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      include: organizationInclude,
      orderBy: buildOrderBy(filter.sortBy, filter.sortDir),
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.organization.count({ where }),
  ]);

  return { rows, total };
}

/** All org ids matching the filter, unpaged — powers full-filtered-set
 *  totals (`totalOrderVolume`/`totalSettlementDue`) alongside the paginated
 *  `listOrganizations` result. Organizations are a small B2B partner list,
 *  not high-volume, so fetching every matching id is cheap. */
export function listMatchingOrgIds(
  filter: Pick<
    ListOrganizationsFilter,
    "search" | "type" | "franchiseType" | "active" | "includeDeleted" | "priceListId" | "cityId"
  >,
): Promise<{ id: string }[]> {
  return prisma.organization.findMany({ where: buildWhere(filter), select: { id: true } });
}

/** Same filter/order as listOrganizations but unpaged — for Excel/PDF export. */
export function listAllOrganizationsForExport(
  filter: Pick<ListOrganizationsFilter, "search" | "type" | "active" | "includeDeleted">,
) {
  return prisma.organization.findMany({
    where: buildWhere(filter),
    include: organizationInclude,
    orderBy: { createdAt: "desc" },
  });
}

/** Live aggregates per organization — order (appointment) count and
 *  outstanding bill total across all of that org's patients. Batched over
 *  every requested org id in one query (same pattern as the Dashboard's
 *  "Top Organizations" leaderboard) rather than N+1 per-row queries. */
export async function getOrgMetrics(orgIds: string[]): Promise<Map<string, OrgMetrics>> {
  const result = new Map<string, OrgMetrics>(
    orgIds.map((id) => [id, { orderCount: 0, settlementDue: 0 }]),
  );
  if (orgIds.length === 0) return result;

  const appointments = await prisma.appointment.findMany({
    where: { patient: { organizationId: { in: orgIds } } },
    select: {
      patient: { select: { organizationId: true } },
      bill: { select: { dueAmount: true } },
    },
  });

  for (const a of appointments) {
    const orgId = a.patient.organizationId;
    if (!orgId) continue;
    const entry = result.get(orgId);
    if (!entry) continue;
    entry.orderCount += 1;
    entry.settlementDue += Number(a.bill?.dueAmount ?? 0);
  }

  return result;
}

export function findOrganizationById(id: string) {
  return prisma.organization.findFirst({
    where: { id, deletedAt: null },
    include: organizationInclude,
  });
}

/** Ignores soft-delete — used by internal ownership checks (e.g. auth) where
 *  a deleted org must still resolve to correctly deny access. */
export function findOrganizationByIdIncludingDeleted(id: string) {
  return prisma.organization.findUnique({ where: { id }, include: organizationInclude });
}

export function createOrganization(data: OrganizationWriteInput & { code: string }) {
  return prisma.organization.create({
    data: { ...data, active: data.active ?? true },
    include: organizationInclude,
  });
}

/** Codes already taken that start with `base` — the input to
 *  `pickAvailableCode`. Read inside the creating transaction so the choice is
 *  made against the freshest possible view; the `code` unique index remains the
 *  actual arbiter if two concurrent creates still pick the same one. */
export function listCodesStartingWith(base: string, tx: Prisma.TransactionClient) {
  return tx.organization
    .findMany({
      where: { code: { startsWith: base, mode: "insensitive" } },
      select: { code: true },
    })
    .then((rows) => rows.map((row) => row.code));
}

export function findCityById(id: string) {
  return prisma.city.findUnique({ where: { id }, select: { id: true, name: true } });
}

/**
 * Mints a franchise's PRIVATE price list from an admin template and points the
 * organization at it, replacing any clone it already had.
 *
 * This is the whole of the clone-on-assign guarantee: assigning never links the
 * template itself, so two franchises can never end up editing one row. The
 * previous clone is soft-deleted rather than dropped — historical
 * `AppointmentTest.price` values were resolved through it, and deleting it
 * would make old bills unexplainable.
 *
 * Callable inside a caller-supplied transaction (organization creation) or
 * standalone (reassignment from the detail drawer).
 */
export async function cloneAndAssignPriceList(
  tx: Prisma.TransactionClient,
  organizationId: string,
  templateId: string,
  organizationCode: string,
): Promise<{ id: string; name: string }> {
  const template = await tx.priceList.findFirst({
    where: { id: templateId, deletedAt: null },
    select: { id: true, name: true, description: true, active: true, ownerOrganizationId: true },
  });
  if (!template) {
    throw ApiError.badRequest("Selected price list does not exist");
  }
  if (template.ownerOrganizationId) {
    throw ApiError.badRequest(
      "That price list belongs to another franchise. Pick an admin template instead.",
    );
  }

  // Retire the outgoing clone first: `ownerOrganizationId` is UNIQUE, so the
  // new one cannot be inserted while the old still claims this organization.
  const existing = await tx.priceList.findUnique({
    where: { ownerOrganizationId: organizationId },
    select: { id: true },
  });
  if (existing) {
    await tx.priceList.update({
      where: { id: existing.id },
      data: { ownerOrganizationId: null, deletedAt: new Date(), active: false },
    });
  }

  const clone = await tx.priceList.create({
    data: {
      name: `${template.name} — ${organizationCode}`,
      description: template.description,
      active: template.active,
      ownerOrganizationId: organizationId,
      templateId: template.id,
    },
    select: { id: true, name: true },
  });

  const items = await tx.priceListItem.findMany({
    where: { priceListId: template.id },
    select: { itemType: true, itemId: true, price: true },
  });
  if (items.length > 0) {
    await tx.priceListItem.createMany({
      data: items.map((item) => ({ ...item, priceListId: clone.id })),
    });
  }

  await tx.organization.update({
    where: { id: organizationId },
    data: { priceListId: clone.id },
  });

  return clone;
}

/** The franchise's own list, with every override it carries. Filtered by owner
 *  as well as id so a franchise cannot read a template or another's clone even
 *  if it somehow learned the id. */
export function findOwnedPriceList(organizationId: string) {
  return prisma.priceList.findFirst({
    where: { ownerOrganizationId: organizationId, deletedAt: null },
    include: { items: true },
  });
}

export function replaceOwnedPriceListItems(
  priceListId: string,
  items: { itemType: PriceListItemType; itemId: string; price: number; isOffered: boolean }[],
) {
  return prisma.$transaction([
    prisma.priceListItem.deleteMany({ where: { priceListId } }),
    ...(items.length > 0
      ? [prisma.priceListItem.createMany({ data: items.map((item) => ({ ...item, priceListId })) })]
      : []),
  ]);
}

export interface OrganizationLoginSeed {
  username: string;
  passwordHash: string;
  roleId: string;
  enabledModules: OrganizationModule[];
}

/** Creates an Organization and, in the SAME transaction, its portal login.
 *
 *  Franchise onboarding is one action from the operator's point of view — the
 *  form collects the organization and its username/password together — so it
 *  must not be able to half-succeed. The pre-existing two-call flow
 *  (`POST /organizations` then `POST /organizations/:id/login`) could leave a
 *  franchise that exists but cannot log in if the second call failed, and a
 *  duplicate username was only discovered after the organization had already
 *  been committed.
 *
 *  The code is minted inside the transaction too, so a rollback does not burn
 *  a visible gap in the ORG###### sequence for anything other than a genuine
 *  concurrent insert.
 *
 *  `login` is optional: an Organization created without portal access (a
 *  referral-only General Center) takes the same path with `loginEnabled` left
 *  false, so there is only one creation code path to reason about. */
export function createOrganizationWithLogin(
  data: OrganizationWriteInput,
  mintCode: (tx: Prisma.TransactionClient) => Promise<string>,
  login?: OrganizationLoginSeed,
) {
  // `priceListId` from the form names a TEMPLATE, not the list the organization
  // ends up on. It is held back from the insert and run through
  // `cloneAndAssignPriceList` below, which mints the franchise's private copy.
  const { priceListId: priceListTemplateId, ...organizationData } = data;

  return prisma.$transaction(async (tx) => {
    const code = await mintCode(tx);

    const organization = await tx.organization.create({
      data: {
        ...organizationData,
        code,
        active: organizationData.active ?? true,
        loginEnabled: login !== undefined,
        ...(login ? { enabledModules: login.enabledModules } : {}),
      },
      include: organizationInclude,
    });

    if (priceListTemplateId) {
      await cloneAndAssignPriceList(tx, organization.id, priceListTemplateId, organization.code);
    }

    if (login) {
      await tx.user.create({
        data: {
          organizationId: organization.id,
          username: login.username,
          passwordHash: login.passwordHash,
          roleId: login.roleId,
          fullName: organization.name,
        },
      });
    }

    // Re-read so the returned row carries the freshly created `users` relation
    // and the cloned price list, both of which `toOrganizationDto` reports.
    return tx.organization.findUniqueOrThrow({
      where: { id: organization.id },
      include: organizationInclude,
    });
  });
}

/** Standalone reassignment — the Superadmin detail drawer's price list picker.
 *  Discards the franchise's own edits by design: it is moving to a different
 *  template, so the UI confirms before calling this. */
export function reassignPriceList(organizationId: string, templateId: string, code: string) {
  return prisma.$transaction((tx) => cloneAndAssignPriceList(tx, organizationId, templateId, code));
}

export function updateOrganization(id: string, data: OrganizationWriteInput) {
  return prisma.organization.update({
    where: { id },
    data,
    include: organizationInclude,
  });
}

export function softDeleteOrganization(id: string) {
  return prisma.organization.update({
    where: { id },
    data: { deletedAt: new Date(), active: false },
    include: organizationInclude,
  });
}

export function restoreOrganization(id: string) {
  return prisma.organization.update({
    where: { id },
    data: { deletedAt: null },
    include: organizationInclude,
  });
}

export function setOrganizationStatus(id: string, active: boolean) {
  return prisma.organization.update({
    where: { id },
    data: { active },
    include: organizationInclude,
  });
}

export function setOrganizationLoginEnabled(id: string, loginEnabled: boolean) {
  return prisma.organization.update({
    where: { id },
    data: { loginEnabled },
    include: organizationInclude,
  });
}

export function setOrganizationEnabledModules(id: string, enabledModules: OrganizationModule[]) {
  return prisma.organization.update({
    where: { id },
    data: { enabledModules },
    include: organizationInclude,
  });
}

export function createAuditLog(
  organizationId: string,
  action: string,
  performedByUserId?: string | null,
  note?: string | null,
) {
  return prisma.organizationAuditLog.create({
    data: { organizationId, action, performedByUserId, note },
  });
}

export function listAuditLogs(organizationId: string) {
  return prisma.organizationAuditLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export function createLoginUser(data: {
  organizationId: string;
  username: string;
  passwordHash: string;
  roleId: string;
  fullName: string;
}) {
  return prisma.user.create({
    data: {
      organizationId: data.organizationId,
      username: data.username,
      passwordHash: data.passwordHash,
      roleId: data.roleId,
      fullName: data.fullName,
    },
  });
}

export function updateLoginUser(
  userId: string,
  data: { roleId?: string; isActive?: boolean; passwordHash?: string },
) {
  return prisma.user.update({ where: { id: userId }, data });
}

export function findLoginUserByOrganizationId(organizationId: string) {
  return prisma.user.findUnique({ where: { organizationId } });
}

// ---------------------------------------------------------------------------
// Service areas — which Area(s) a franchise is assigned to cover. Distinct
// from `cityId`: a franchise's order-visibility scope (`franchiseOrderScope`
// in `services/franchiseOrderScope.ts`) is these areas, not "the whole city."
// ---------------------------------------------------------------------------

export function listServiceAreas(organizationId: string) {
  return prisma.organizationServiceArea.findMany({
    where: { organizationId },
    include: {
      area: {
        select: {
          id: true,
          name: true,
          cityId: true,
          city: { select: { name: true, state: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

/** Replaces the full assignment set in one transaction — same delete-then-
 *  recreate approach as `replacePriceListItems`/`replaceOwnedPriceListItems`,
 *  simpler and safer than diffing add/remove client-side. */
export function replaceServiceAreas(organizationId: string, areaIds: string[]) {
  return prisma.$transaction([
    prisma.organizationServiceArea.deleteMany({ where: { organizationId } }),
    ...(areaIds.length > 0
      ? [
          prisma.organizationServiceArea.createMany({
            data: areaIds.map((areaId) => ({ organizationId, areaId })),
          }),
        ]
      : []),
  ]);
}

/** Adds one area to an organization's existing coverage without touching the
 *  rest — unlike `replaceServiceAreas`, which replaces the whole set. Used
 *  when approving an `AreaApprovalRequest`: the new Area a franchise asked
 *  for gets added to what it already has, not substituted for it. Takes a
 *  transaction client since it's always called alongside the Area's own
 *  creation. */
export function addServiceArea(
  organizationId: string,
  areaId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.organizationServiceArea.create({ data: { organizationId, areaId } });
}

import type {
  Package,
  PackageParameter,
  PackageTest,
  Parameter,
  Prisma,
  Test,
} from "@prisma/client";
import { prisma } from "../config/database";
import { generateUniqueSlug } from "../utils/slug.util";
import type { PackageDto, PackageWriteRecord, RecommendedGender } from "../types/package.types";

export interface ListPackagesFilter {
  search?: string;
  active?: string;
  includeDeleted?: boolean;
  appCategoryId?: string;
  sampleTypeId?: string;
  sortBy?: string;
  sortDir?: string;
  skip: number;
  take: number;
}

type PackageWithMembers = Package & {
  appCategory: { name: string } | null;
  sampleType: { name: string } | null;
  packageTests: (PackageTest & { test: Test })[];
  packageParameters: (PackageParameter & { parameter: Parameter })[];
};

const withMembers = {
  appCategory: { select: { name: true } },
  sampleType: { select: { name: true } },
  packageTests: { include: { test: true } },
  packageParameters: { include: { parameter: true } },
} satisfies Prisma.PackageInclude;

const SORTABLE_FIELDS = new Set([
  "name",
  "price",
  "active",
  "createdAt",
  "updatedAt",
  "sortOrder",
  "serialNo",
]);

/** Maps a Prisma row (with both membership joins loaded) to the exact shape
 *  the frontend's `LabPackage` expects — mirrors `toLabTest`/`toPriceListDto`. */
export function toPackageDto(pkg: PackageWithMembers): PackageDto {
  const tests = pkg.packageTests.map((pt) => ({
    testId: pt.testId,
    testName: pt.test.name,
    testShortName: pt.test.shortName,
    testSerialNo: pt.test.serialNo,
    price: Number(pt.test.price),
  }));

  const parameters = pkg.packageParameters.map((pp) => ({
    parameterId: pp.parameterId,
    parameterName: pp.parameter.name,
    parameterShortName: pp.parameter.shortName,
    parameterSerialNo: pp.parameter.serialNo,
    price: Number(pp.parameter.price),
  }));

  return {
    id: pkg.id,
    name: pkg.name,
    appCategoryId: pkg.appCategoryId,
    appCategory: pkg.appCategory?.name ?? null,
    sampleTypeId: pkg.sampleTypeId,
    sampleType: pkg.sampleType?.name ?? null,
    price: Number(pkg.price),
    offerPrice: pkg.offerPrice === null ? null : Number(pkg.offerPrice),
    description: pkg.description,
    reportTime: pkg.reportTime,
    isFastingRequired: pkg.isFastingRequired,
    fastingHours: pkg.fastingHours,
    followUpDays: pkg.followUpDays,
    followUpTemplate: pkg.followUpTemplate,
    recommendedFor: pkg.recommendedFor as RecommendedGender,
    recommendedAge: pkg.recommendedAge,
    sampleReportUrl: pkg.sampleReportUrl,
    testCount: tests.length,
    tests,
    parameterCount: parameters.length,
    parameters,
    active: pkg.active,
    isPopular: pkg.isPopular,
    bookedCount: pkg.bookedCount,
    sortOrder: pkg.sortOrder,
    serialNo: pkg.serialNo,
    deletedAt: pkg.deletedAt ? pkg.deletedAt.toISOString() : null,
    createdAt: pkg.createdAt.toISOString(),
    updatedAt: pkg.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<
    ListPackagesFilter,
    "search" | "active" | "includeDeleted" | "appCategoryId" | "sampleTypeId"
  >,
): Prisma.PackageWhereInput {
  const where: Prisma.PackageWhereInput = {};

  if (!filter.includeDeleted) {
    where.deletedAt = null;
  }
  if (filter.search) {
    where.name = { contains: filter.search, mode: "insensitive" };
  }
  if (filter.active === "true") {
    where.active = true;
  } else if (filter.active === "false") {
    where.active = false;
  }
  if (filter.appCategoryId && filter.appCategoryId !== "all") {
    where.appCategoryId = filter.appCategoryId;
  }
  if (filter.sampleTypeId && filter.sampleTypeId !== "all") {
    where.sampleTypeId = filter.sampleTypeId;
  }

  return where;
}

/** No explicit `sortBy` defaults to `sortOrder` ascending (ties broken by
 *  name) rather than `createdAt desc` — this is the admin's own curated
 *  display order for the Superadmin Packages list (see `Package.sortOrder`'s
 *  doc-comment); an explicit `sortBy` still overrides it same as before. This
 *  is purely a Superadmin-list concern — the patient app's catalogue
 *  (`catalog.service.ts#listPackages`) has its own, unrelated `bookedCount`
 *  ordering and never calls this function. */
function buildOrderBy(
  sortBy?: string,
  sortDir?: string,
): Prisma.PackageOrderByWithRelationInput | Prisma.PackageOrderByWithRelationInput[] {
  if (!sortBy) {
    return [{ sortOrder: "asc" }, { name: "asc" }];
  }
  const field = SORTABLE_FIELDS.has(sortBy) ? sortBy : "createdAt";
  return { [field]: sortDir === "asc" ? "asc" : "desc" };
}

export async function listPackages(
  filter: ListPackagesFilter,
): Promise<{ rows: PackageWithMembers[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.package.findMany({
      where,
      include: withMembers,
      orderBy: buildOrderBy(filter.sortBy, filter.sortDir),
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.package.count({ where }),
  ]);

  return { rows, total };
}

export function findPackageById(id: string) {
  return prisma.package.findFirst({ where: { id, deletedAt: null }, include: withMembers });
}

/** Case-insensitive Name lookup — the upsert key CSV import matches an
 *  existing Package against (see `package.service.ts#importPackagesCsv`). */
export function findPackageByName(name: string) {
  return prisma.package.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, deletedAt: null },
    include: withMembers,
  });
}

/** Every non-deleted Package with its members — used only by CSV export
 *  (`package.service.ts#exportPackagesCsv`). */
export function findAllPackagesForExport() {
  return prisma.package.findMany({
    where: { deletedAt: null },
    include: withMembers,
    orderBy: { name: "asc" },
  });
}

/** Every optional field is applied only when the caller actually sent it, so a
 *  partial update can't null out a value the payload simply omitted. */
function toPackageScalarData(data: PackageWriteRecord) {
  return {
    name: data.name,
    price: data.price,
    offerPrice: data.offerPrice ?? null,
    ...(data.appCategoryId !== undefined ? { appCategoryId: data.appCategoryId || null } : {}),
    ...(data.sampleTypeId !== undefined ? { sampleTypeId: data.sampleTypeId || null } : {}),
    ...(data.description !== undefined ? { description: data.description || null } : {}),
    ...(data.reportTime !== undefined ? { reportTime: data.reportTime || null } : {}),
    ...(data.isFastingRequired !== undefined ? { isFastingRequired: data.isFastingRequired } : {}),
    // Fasting hours are meaningless once fasting isn't required, so they're
    // cleared alongside the flag rather than left as a stale leftover.
    ...(data.isFastingRequired === false
      ? { fastingHours: null }
      : data.fastingHours !== undefined
        ? { fastingHours: data.fastingHours ?? null }
        : {}),
    ...(data.followUpDays !== undefined ? { followUpDays: data.followUpDays || null } : {}),
    ...(data.followUpTemplate !== undefined
      ? { followUpTemplate: data.followUpTemplate || null }
      : {}),
    ...(data.recommendedFor !== undefined ? { recommendedFor: data.recommendedFor } : {}),
    ...(data.recommendedAge !== undefined ? { recommendedAge: data.recommendedAge || null } : {}),
    ...(data.active !== undefined ? { active: data.active } : {}),
    ...(data.isPopular !== undefined ? { isPopular: data.isPopular } : {}),
    ...(data.bookedCount !== undefined ? { bookedCount: data.bookedCount } : {}),
    ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
  };
}

/** Creates the Package row and both membership joins in one transaction. Takes
 *  a `PackageWriteRecord` (ids only) — short names are already resolved by the
 *  service, so nothing below this line ever matches on a name. */
export async function createPackage(data: PackageWriteRecord) {
  // See `Test.slug`'s doc-comment in schema.prisma — same rule here: set
  // once at creation, never re-derived on rename.
  const slug = await generateUniqueSlug(
    data.name,
    async (candidate) =>
      !!(await prisma.package.findUnique({ where: { slug: candidate }, select: { id: true } })),
    "package",
  );

  return prisma.package.create({
    data: {
      ...toPackageScalarData(data),
      slug,
      active: data.active ?? true,
      isPopular: data.isPopular ?? false,
      packageTests: data.testIds.length
        ? { createMany: { data: data.testIds.map((testId) => ({ testId })) } }
        : undefined,
      packageParameters: data.parameterIds.length
        ? { createMany: { data: data.parameterIds.map((parameterId) => ({ parameterId })) } }
        : undefined,
    },
    include: withMembers,
  });
}

/** Updates the Package row and fully replaces both membership joins —
 *  simpler and safer than diffing add/update/remove client-side, same
 *  convention as `replacePriceListItems`. */
export async function updatePackage(id: string, data: PackageWriteRecord) {
  await prisma.$transaction([
    prisma.package.update({ where: { id }, data: toPackageScalarData(data) }),
    prisma.packageTest.deleteMany({ where: { packageId: id } }),
    prisma.packageParameter.deleteMany({ where: { packageId: id } }),
    prisma.packageTest.createMany({
      data: data.testIds.map((testId) => ({ packageId: id, testId })),
    }),
    prisma.packageParameter.createMany({
      data: data.parameterIds.map((parameterId) => ({ packageId: id, parameterId })),
    }),
  ]);

  return prisma.package.findUniqueOrThrow({ where: { id }, include: withMembers });
}

export function softDeletePackage(id: string) {
  return prisma.package.update({
    where: { id },
    data: { deletedAt: new Date(), active: false },
  });
}

export function restorePackage(id: string) {
  return prisma.package.update({ where: { id }, data: { deletedAt: null } });
}

export function setPackageStatus(id: string, active: boolean) {
  return prisma.package.update({ where: { id }, data: { active } });
}

export function setPackagePopular(id: string, isPopular: boolean) {
  return prisma.package.update({ where: { id }, data: { isPopular } });
}

/** Stores the uploaded sample-report path on its own — the upload happens as a
 *  separate request from the form's Save. */
export function setPackageSampleReportUrl(id: string, sampleReportUrl: string | null) {
  return prisma.package.update({
    where: { id },
    data: { sampleReportUrl },
    include: withMembers,
  });
}

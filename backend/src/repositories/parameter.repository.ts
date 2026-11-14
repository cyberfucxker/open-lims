import type { Parameter, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type {
  ParameterDto,
  ParameterWriteData,
  RecommendedGender,
  SampleCollectionMode,
} from "../types/parameter.types";

type ParameterWithRelations = Parameter & {
  sampleType: { name: string } | null;
  department: { name: string } | null;
  appCategory: { name: string } | null;
  _count: { testParameters: number };
};

const withRelations = {
  sampleType: { select: { name: true } },
  department: { select: { name: true } },
  appCategory: { select: { name: true } },
  _count: { select: { testParameters: true } },
} satisfies Prisma.ParameterInclude;

export interface ListParametersFilter {
  search?: string;
  doTest?: string;
  active?: string;
  sampleTypeId?: string;
  departmentId?: string;
  appCategoryId?: string;
  skip: number;
  take: number;
}

export function toParameterDto(row: ParameterWithRelations): ParameterDto {
  return {
    id: row.id,
    name: row.name,
    shortName: row.shortName,
    price: Number(row.price),
    offerPrice: row.offerPrice === null ? null : Number(row.offerPrice),
    doTest: row.doTest,
    isCommonlyUsed: row.isCommonlyUsed,
    sortOrder: row.sortOrder,
    serialNo: row.serialNo,
    sampleTypeId: row.sampleTypeId,
    sampleType: row.sampleType?.name ?? null,
    departmentId: row.departmentId,
    department: row.department?.name ?? null,
    appCategoryId: row.appCategoryId,
    appCategory: row.appCategory?.name ?? null,
    reportTime: row.reportTime,
    sampleCollection: row.sampleCollection as SampleCollectionMode,
    isFastingRequired: row.isFastingRequired,
    fastingHours: row.fastingHours,
    followUpDays: row.followUpDays,
    followUpTemplate: row.followUpTemplate,
    recommendedFor: row.recommendedFor as RecommendedGender,
    recommendedAge: row.recommendedAge,
    description: row.description,
    sampleReportUrl: row.sampleReportUrl,
    active: row.active,
    testCount: row._count.testParameters,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<
    ListParametersFilter,
    "search" | "doTest" | "active" | "sampleTypeId" | "departmentId" | "appCategoryId"
  >,
): Prisma.ParameterWhereInput {
  const where: Prisma.ParameterWhereInput = {};

  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { shortName: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter.doTest === "true") {
    where.doTest = true;
  } else if (filter.doTest === "false") {
    where.doTest = false;
  }
  if (filter.active === "true") {
    where.active = true;
  } else if (filter.active === "false") {
    where.active = false;
  }
  if (filter.sampleTypeId && filter.sampleTypeId !== "all") {
    where.sampleTypeId = filter.sampleTypeId;
  }
  if (filter.departmentId && filter.departmentId !== "all") {
    where.departmentId = filter.departmentId;
  }
  if (filter.appCategoryId && filter.appCategoryId !== "all") {
    where.appCategoryId = filter.appCategoryId;
  }

  return where;
}

export async function listParameters(
  filter: ListParametersFilter,
): Promise<{ rows: ParameterWithRelations[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.parameter.findMany({
      where,
      include: withRelations,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.parameter.count({ where }),
  ]);

  return { rows, total };
}

export function findParameterById(id: string) {
  return prisma.parameter.findUnique({ where: { id }, include: withRelations });
}

/** Case-insensitive Short Name lookup. `findMany` rather than `findFirst` on
 *  purpose: the caller needs to distinguish "no match" from "ambiguous match"
 *  and reject both, instead of silently taking whichever row came back first —
 *  that behaviour is what produced the original duplicate-"CBC" mis-mapping. */
export function findParametersByShortName(shortName: string) {
  return prisma.parameter.findMany({
    where: { shortName: { equals: shortName, mode: "insensitive" } },
  });
}

export function findParametersByIds(ids: string[]) {
  return prisma.parameter.findMany({ where: { id: { in: ids } } });
}

/** Every Parameter, unpaginated — CSV export and the admin pickers, which need
 *  the whole (small) analyte list rather than a page of it. */
export function findAllParametersForExport() {
  return prisma.parameter.findMany({
    include: withRelations,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

/** Maps the write DTO onto Prisma's shape. Every optional field is applied only
 *  when the caller actually sent it (`!== undefined`), so a partial update can't
 *  silently null out a value the form didn't include — the admin form always
 *  sends the full object, but CSV import and the upload endpoint don't. */
function toPrismaData(data: ParameterWriteData) {
  return {
    name: data.name,
    shortName: data.shortName,
    price: data.price,
    offerPrice: data.offerPrice ?? null,
    ...(data.doTest !== undefined ? { doTest: data.doTest } : {}),
    ...(data.isCommonlyUsed !== undefined ? { isCommonlyUsed: data.isCommonlyUsed } : {}),
    ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    // CSV-import-only override — see `ParameterWriteData.serialNo`'s
    // doc-comment. Omitted (the normal admin-form path) leaves `serialNo` on
    // its DB-assigned `autoincrement()` default entirely.
    ...(data.serialNo !== undefined ? { serialNo: data.serialNo } : {}),
    ...(data.sampleTypeId !== undefined ? { sampleTypeId: data.sampleTypeId || null } : {}),
    ...(data.departmentId !== undefined ? { departmentId: data.departmentId || null } : {}),
    ...(data.appCategoryId !== undefined ? { appCategoryId: data.appCategoryId || null } : {}),
    ...(data.reportTime !== undefined ? { reportTime: data.reportTime || null } : {}),
    ...(data.sampleCollection !== undefined ? { sampleCollection: data.sampleCollection } : {}),
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
    ...(data.description !== undefined ? { description: data.description || null } : {}),
    ...(data.sampleReportUrl !== undefined
      ? { sampleReportUrl: data.sampleReportUrl || null }
      : {}),
    ...(data.active !== undefined ? { active: data.active } : {}),
  };
}

export function createParameter(data: ParameterWriteData) {
  return prisma.parameter.create({
    data: { ...toPrismaData(data), doTest: data.doTest ?? false, active: data.active ?? true },
    include: withRelations,
  });
}

export function updateParameter(id: string, data: ParameterWriteData) {
  return prisma.parameter.update({
    where: { id },
    data: toPrismaData(data),
    include: withRelations,
  });
}

/** Stores the uploaded sample-report path on its own, without touching any other
 *  field — the upload happens as a separate request from the form's Save. */
export function setParameterSampleReportUrl(id: string, sampleReportUrl: string | null) {
  return prisma.parameter.update({
    where: { id },
    data: { sampleReportUrl },
    include: withRelations,
  });
}

export function deleteParameter(id: string) {
  return prisma.parameter.delete({ where: { id } });
}

/** How many Tests / Packages would break if this Parameter were deleted. Both
 *  joins are ON DELETE RESTRICT, so this is a pre-flight check that turns a
 *  Postgres FK violation into an explanatory 409. */
export async function countParameterUsage(id: string) {
  const [testCount, packageCount] = await Promise.all([
    prisma.testParameter.count({ where: { parameterId: id } }),
    prisma.packageParameter.count({ where: { parameterId: id } }),
  ]);
  return { testCount, packageCount };
}

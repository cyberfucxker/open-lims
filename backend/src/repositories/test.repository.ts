import type { Parameter, Prisma, Test, TestParameter } from "@prisma/client";
import { prisma } from "../config/database";
import { generateUniqueSlug } from "../utils/slug.util";
import type {
  LabTest,
  RecommendedGender,
  TestAttachedParameter,
  TestParameterLinkInput,
  TestStatus,
  TestWriteData,
} from "../types/test.types";

type TestWithRelations = Test & {
  department: { name: string } | null;
  category: { name: string } | null;
  appCategory: { name: string } | null;
  sampleType: { name: string };
  parameters: (TestParameter & { parameter: Parameter })[];
  branchUsers: {
    userId: string;
    user: { username: string; fullName: string | null; organization: { name: string } | null };
  }[];
};

const withRelations = {
  department: { select: { name: true } },
  category: { select: { name: true } },
  appCategory: { select: { name: true } },
  sampleType: { select: { name: true } },
  parameters: { include: { parameter: true }, orderBy: { sortOrder: "asc" } },
  branchUsers: {
    select: {
      userId: true,
      user: {
        select: { username: true, fullName: true, organization: { select: { name: true } } },
      },
    },
  },
} satisfies Prisma.TestInclude;

export interface ListTestsFilter {
  search?: string;
  categoryId?: string;
  departmentId?: string;
  appCategoryId?: string;
  status?: string;
  skip: number;
  take: number;
}

function toAttachedParameter(row: TestParameter & { parameter: Parameter }): TestAttachedParameter {
  return {
    id: row.id,
    parameterId: row.parameterId,
    name: row.parameter.name,
    shortName: row.parameter.shortName,
    price: Number(row.parameter.price),
    offerPrice: row.parameter.offerPrice === null ? null : Number(row.parameter.offerPrice),
    bookable: row.parameter.doTest,
    sortOrder: row.sortOrder,
    unit: row.unit,
    referenceRangeText: row.referenceRangeText,
    referenceRangeLow: row.referenceRangeLow === null ? null : Number(row.referenceRangeLow),
    referenceRangeHigh: row.referenceRangeHigh === null ? null : Number(row.referenceRangeHigh),
    formula: row.formula,
    active: row.active,
  };
}

/** Maps a Prisma row (with all relations loaded) to the exact shape the
 *  frontend's `LabTest` type expects. */
export function toLabTest(test: TestWithRelations): LabTest {
  const parameters = test.parameters.map(toAttachedParameter);

  return {
    id: test.id,
    name: test.name,
    shortName: test.shortName,
    departmentId: test.departmentId,
    department: test.department?.name ?? null,
    categoryId: test.categoryId,
    category: test.category?.name ?? null,
    appCategoryId: test.appCategoryId,
    appCategory: test.appCategory?.name ?? null,
    price: Number(test.price),
    sampleTypeId: test.sampleTypeId,
    sampleType: test.sampleType.name,
    reportTime: test.reportTime,
    status: test.status as TestStatus,
    description: test.description,
    content: test.content,
    offerPrice: test.offerPrice === null ? null : Number(test.offerPrice),
    isPopular: test.isPopular,
    bookedCount: test.bookedCount,
    sortOrder: test.sortOrder,
    serialNo: test.serialNo,
    isFastingRequired: test.isFastingRequired,
    fastingHours: test.fastingHours,
    followUpDays: test.followUpDays,
    followUpTemplate: test.followUpTemplate,
    recommendedFor: test.recommendedFor as RecommendedGender,
    recommendedAge: test.recommendedAge,
    sampleReportUrl: test.sampleReportUrl,
    parameters,
    parameterCount: parameters.length,
    branchUsers: test.branchUsers.map((row) => ({
      userId: row.userId,
      username: row.user.username,
      fullName: row.user.fullName,
      organizationName: row.user.organization?.name ?? null,
    })),
    createdAt: test.createdAt.toISOString().slice(0, 10),
  };
}

function buildWhere(
  filter: Pick<
    ListTestsFilter,
    "search" | "categoryId" | "departmentId" | "appCategoryId" | "status"
  >,
): Prisma.TestWhereInput {
  // Auto-provisioned single-parameter Tests (see `Test.sourceParameterId`'s
  // doc-comment) are excluded from Superadmin's own Tests list by default —
  // there are hundreds of them (one per bookable Parameter), and admins
  // manage the analyte via Parameters, not this row. They still fully
  // participate in every booking/billing/report path; this only hides them
  // from the curated list a human edits by hand.
  const where: Prisma.TestWhereInput = { sourceParameterId: null };

  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { shortName: { contains: filter.search, mode: "insensitive" } },
      { appCategory: { name: { contains: filter.search, mode: "insensitive" } } },
      { department: { name: { contains: filter.search, mode: "insensitive" } } },
    ];
  }
  if (filter.categoryId && filter.categoryId !== "all") {
    where.categoryId = filter.categoryId;
  }
  if (filter.departmentId && filter.departmentId !== "all") {
    where.departmentId = filter.departmentId;
  }
  if (filter.appCategoryId && filter.appCategoryId !== "all") {
    where.appCategoryId = filter.appCategoryId;
  }
  if (filter.status && filter.status !== "all") {
    where.status = filter.status;
  }

  return where;
}

export async function listTests(
  filter: ListTestsFilter,
): Promise<{ rows: TestWithRelations[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.test.findMany({
      where,
      include: withRelations,
      // Admin's own curated order (see `Test.sortOrder`'s doc-comment) rather
      // than newest-first — ties break on name.
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.test.count({ where }),
  ]);

  return { rows, total };
}

export function findTestById(id: string) {
  return prisma.test.findUnique({ where: { id }, include: withRelations });
}

/** Case-insensitive Short Name lookup returning EVERY match, so the caller can
 *  reject an ambiguous name rather than silently binding to one of the rows —
 *  see `findParametersByShortName`'s note for the bug this prevents. The DB's
 *  own `tests_short_name_key` makes >1 match impossible for exact case, but
 *  "cbc" vs "CBC" can still collide without the case-insensitive guard in
 *  `test.service.ts`. */
export function findTestsByShortName(shortName: string) {
  return prisma.test.findMany({
    where: { shortName: { equals: shortName, mode: "insensitive" } },
    include: withRelations,
  });
}

/** Used internally by the appointment module to validate/price selected
 *  tests — reuses the existing Test catalogue rather than duplicating it. */
export function findTestsByIds(ids: string[]) {
  return prisma.test.findMany({ where: { id: { in: ids } }, include: withRelations });
}

/** Maps the form's ordered parameter list onto `TestParameter` rows. Array
 *  position IS `sortOrder`, so the admin's drag order is what the report
 *  prints — there's no separate reorder round-trip on save. */
function toParameterCreateRows(links: TestParameterLinkInput[]) {
  return links.map((link, index) => ({
    parameterId: link.parameterId,
    sortOrder: index,
    unit: link.unit ?? null,
    referenceRangeText: link.referenceRangeText ?? null,
    referenceRangeLow: link.referenceRangeLow ?? null,
    referenceRangeHigh: link.referenceRangeHigh ?? null,
    formula: link.formula ?? null,
    active: link.active ?? true,
  }));
}

/** Every optional field is applied only when the caller actually sent it, so a
 *  partial update can't null out a value the payload simply omitted. */
function toTestScalarData(data: TestWriteData) {
  return {
    name: data.name,
    shortName: data.shortName,
    sampleTypeId: data.sampleTypeId,
    price: data.price,
    reportTime: data.reportTime,
    status: data.status,
    ...(data.departmentId !== undefined ? { departmentId: data.departmentId || null } : {}),
    ...(data.categoryId !== undefined ? { categoryId: data.categoryId || null } : {}),
    ...(data.appCategoryId !== undefined ? { appCategoryId: data.appCategoryId || null } : {}),
    ...(data.description !== undefined ? { description: data.description || null } : {}),
    ...(data.content !== undefined ? { content: data.content || null } : {}),
    offerPrice: data.offerPrice ?? null,
    ...(data.isPopular !== undefined ? { isPopular: data.isPopular } : {}),
    ...(data.bookedCount !== undefined ? { bookedCount: data.bookedCount } : {}),
    ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
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
  };
}

export async function createTest(data: TestWriteData) {
  // Generated once, here, and never touched again — see `Test.slug`'s
  // doc-comment in schema.prisma for why a rename doesn't regenerate it.
  const slug = await generateUniqueSlug(
    data.name,
    async (candidate) =>
      !!(await prisma.test.findUnique({ where: { slug: candidate }, select: { id: true } })),
    "test",
  );

  return prisma.test.create({
    data: {
      ...toTestScalarData(data),
      slug,
      isPopular: data.isPopular ?? false,
      parameters: data.parameters?.length
        ? { createMany: { data: toParameterCreateRows(data.parameters) } }
        : undefined,
      branchUsers: data.branchUserIds?.length
        ? { createMany: { data: data.branchUserIds.map((userId) => ({ userId })) } }
        : undefined,
    },
    include: withRelations,
  });
}

/** Updates the Test row and, when provided, replaces its parameter attachments
 *  and branch availability.
 *
 *  Parameters are diffed rather than wiped and recreated: deleting a join row
 *  that a `ReportParameterResult` still points at is refused by Postgres (ON
 *  DELETE RESTRICT), which is intentional — a parameter already carrying entered
 *  results must not vanish from under a report. Diffing means the common case
 *  (reorder, or attach one more analyte) never trips that guard.
 *
 *  Branch users have no such dependants, so they're replaced wholesale. */
export async function updateTest(id: string, data: TestWriteData) {
  await prisma.$transaction(async (tx) => {
    await tx.test.update({ where: { id }, data: toTestScalarData(data) });

    if (data.branchUserIds) {
      await tx.testBranchUser.deleteMany({ where: { testId: id } });
      if (data.branchUserIds.length > 0) {
        await tx.testBranchUser.createMany({
          data: data.branchUserIds.map((userId) => ({ testId: id, userId })),
        });
      }
    }

    if (!data.parameters) return;

    const desired = toParameterCreateRows(data.parameters);
    const desiredIds = new Set(desired.map((row) => row.parameterId));
    const existing = await tx.testParameter.findMany({ where: { testId: id } });
    const existingByParameterId = new Map(existing.map((row) => [row.parameterId, row]));

    const removed = existing.filter((row) => !desiredIds.has(row.parameterId));
    if (removed.length > 0) {
      await tx.testParameter.deleteMany({ where: { id: { in: removed.map((r) => r.id) } } });
    }

    for (const row of desired) {
      const match = existingByParameterId.get(row.parameterId);
      if (match) {
        await tx.testParameter.update({ where: { id: match.id }, data: row });
      } else {
        await tx.testParameter.create({ data: { testId: id, ...row } });
      }
    }
  });

  return prisma.test.findUniqueOrThrow({ where: { id }, include: withRelations });
}

/** Stores the uploaded sample-report path on its own — the upload happens as a
 *  separate request from the form's Save. */
export function setTestSampleReportUrl(id: string, sampleReportUrl: string | null) {
  return prisma.test.update({
    where: { id },
    data: { sampleReportUrl },
    include: withRelations,
  });
}

export function deleteTest(id: string) {
  return prisma.test.delete({ where: { id } });
}

/** Toggles the Home screen's "Popular Tests" flag on its own — same
 *  convention as `setTestSampleReportUrl`, kept separate from the full form's
 *  Save so the Superadmin CMS's Popular Tests picker doesn't need to resend
 *  the whole Test payload just to flip one flag. */
export function setTestPopular(id: string, isPopular: boolean) {
  return prisma.test.update({ where: { id }, data: { isPopular } });
}

/** How many rows outside the catalogue would break if this Test were deleted.
 *  The appointment and package joins are ON DELETE RESTRICT, so this turns a
 *  raw Postgres FK violation into an explanatory 409.
 *
 *  `price_list_items` is the exception: it references the catalogue
 *  polymorphically (`itemType`/`itemId`) and so has no FK to restrict the
 *  delete. This count is therefore not just a nicer error message — it is the
 *  only thing standing between a Test delete and an orphaned price override. */
export async function countTestUsage(id: string) {
  const [appointmentCount, packageCount, priceListCount] = await Promise.all([
    prisma.appointmentTest.count({ where: { testId: id } }),
    prisma.packageTest.count({ where: { testId: id } }),
    prisma.priceListItem.count({ where: { itemType: "TEST", itemId: id } }),
  ]);
  return { appointmentCount, packageCount, priceListCount };
}

/** Reorders a Test's existing attachments without touching membership — backs
 *  the drag-reorder control, which fires independently of the form's Save. */
export async function reorderTestParameters(testId: string, orderedIds: string[]): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.testParameter.updateMany({ where: { id, testId }, data: { sortOrder: index } }),
    ),
  );
}

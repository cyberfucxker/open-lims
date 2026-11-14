import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { parseCsvBuffer, toCsvBuffer } from "../utils/csv";
import * as testRepository from "../repositories/test.repository";
import { toLabTest } from "../repositories/test.repository";
import {
  assertOfferPriceNotAbovePrice,
  assertParameterIdsUsable,
  assertTestShortNameAvailable,
  normalizeShortNames,
  resolveParameterSerialNos,
  resolveParameterShortNames,
} from "./catalogShortName";
import { findUnusableBranchUserIds } from "./branchUser.service";
import { regenerateSitemapInBackground } from "./sitemapGenerator.service";
import type {
  LabTest,
  ListTestsParams,
  ListTestsResult,
  RecommendedGender,
  TestStatus,
  TestWriteData,
} from "../types/test.types";
import type { CsvImportResult } from "../types/csvImport.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const TEST_CSV_HEADERS = [
  "Name",
  "Short Name",
  "Category",
  "Sample Type",
  "Price",
  "Offer Price",
  "Report Time",
  "Is Fasting Required",
  "Fasting Hours",
  "Recommended For",
  "Recommended Age",
  "Description",
  "Status",
  "Popular",
  "Booked Count",
  "Sort Order",
  "Parameter Short Names",
  "Parameter IDs",
  "Branch Usernames",
  // The lab's internal taxonomy, kept at the end because the admin form no
  // longer collects it — see the `Test.departmentId` model doc-comment. A row
  // that leaves both blank is valid.
  "Department",
  "Lab Category",
];

const RECOMMENDED_GENDERS: RecommendedGender[] = ["MALE", "FEMALE", "BOTH"];

function toYesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function parseYesNo(value: string | undefined, fallback: boolean): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return fallback;
  return normalized === "yes" || normalized === "true" || normalized === "1";
}

/** The lab's internal taxonomy is optional now, but still has to be coherent
 *  when supplied: a lab Category belongs to exactly one Department, so a payload
 *  that pairs them inconsistently — or names a category without its department —
 *  is rejected rather than silently saved. */
async function assertLabTaxonomyCoherent(values: TestWriteData): Promise<void> {
  const { categoryId, departmentId } = values;
  if (!categoryId && !departmentId) return;

  if (categoryId && !departmentId) {
    throw ApiError.badRequest("Select a department for the chosen lab category");
  }

  if (departmentId) {
    const department = await prisma.department.findFirst({
      where: { id: departmentId, deletedAt: null },
      select: { id: true },
    });
    if (!department) {
      throw ApiError.badRequest("Selected department does not exist");
    }
  }

  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw ApiError.badRequest("Selected category does not exist");
    }
    if (category.departmentId !== departmentId) {
      throw ApiError.badRequest("Selected category does not belong to the selected department");
    }
  }
}

/** The CMS category tile — the admin form's "Category" dropdown. Validated
 *  server-side so a deactivated tile can't be attached by a stale form. */
async function assertAppCategoryUsable(appCategoryId: string): Promise<void> {
  const appCategory = await prisma.appCategory.findUnique({
    where: { id: appCategoryId },
    select: { name: true, isActive: true },
  });
  if (!appCategory) {
    throw ApiError.badRequest("Selected category does not exist");
  }
  if (!appCategory.isActive) {
    throw ApiError.badRequest(`Category "${appCategory.name}" is inactive`);
  }
}

/** Fasting hours only mean something when fasting is actually required — same
 *  rule as `parameter.service.ts`, so the two forms behave identically. */
function assertFastingConsistent(values: TestWriteData): void {
  if (values.isFastingRequired && values.fastingHours != null && values.fastingHours <= 0) {
    throw ApiError.badRequest("Fasting hours must be greater than zero");
  }
  if (!values.isFastingRequired && values.fastingHours != null && values.fastingHours > 0) {
    throw ApiError.badRequest("Turn on 'Is Fasting Required' before setting fasting hours");
  }
}

async function assertSampleTypeExists(sampleTypeId: string): Promise<void> {
  const sampleType = await prisma.sampleType.findUnique({ where: { id: sampleTypeId } });
  if (!sampleType) {
    throw ApiError.badRequest("Selected sample type does not exist");
  }
}

/** Prisma's "record to update/delete not found" (P2025) is translated into the
 *  same 404 a missing GET would return; P2002 covers the short-name unique index
 *  racing the case-insensitive pre-check. */
async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Test not found");
      }
      if (error.code === "P2002") {
        throw ApiError.conflict("A test with this short name already exists");
      }
      if (error.code === "P2003") {
        throw ApiError.badRequest("One or more selected parameters do not exist");
      }
    }
    throw error;
  }
}

/** Shared create/update validation: master-data consistency, short-name
 *  uniqueness, price sanity, and that every attached Parameter exists and is
 *  active. Note the deliberate absence of a `doTest` requirement — `doTest`
 *  gates being sold *standalone*, and nesting a non-bookable analyte inside a
 *  Test is exactly what it's for. */
async function assertTestWritable(values: TestWriteData, excludeId?: string): Promise<void> {
  await assertLabTaxonomyCoherent(values);
  if (values.appCategoryId) {
    await assertAppCategoryUsable(values.appCategoryId);
  }
  await assertSampleTypeExists(values.sampleTypeId);
  assertOfferPriceNotAbovePrice(values.price, values.offerPrice);
  assertFastingConsistent(values);
  await assertTestShortNameAvailable(values.shortName, excludeId);

  if (values.parameters?.length) {
    const parameterIds = values.parameters.map((p) => p.parameterId);
    const unique = new Set(parameterIds);
    if (unique.size !== parameterIds.length) {
      throw ApiError.badRequest("The same parameter can't be attached to a test twice");
    }
    await assertParameterIdsUsable(parameterIds);
  }

  if (values.branchUserIds?.length) {
    const unusable = await findUnusableBranchUserIds(values.branchUserIds);
    if (unusable.length > 0) {
      throw ApiError.badRequest(
        "One or more selected branch users don't exist, are inactive, or aren't branch logins",
      );
    }
  }
}

export async function listTests(params: ListTestsParams): Promise<ListTestsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await testRepository.listTests({
    search: params.search,
    categoryId: params.categoryId,
    departmentId: params.departmentId,
    appCategoryId: params.appCategoryId,
    status: params.status,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toLabTest), total };
}

export async function getTest(id: string): Promise<LabTest> {
  const test = await testRepository.findTestById(id);
  if (!test) {
    throw ApiError.notFound("Test not found");
  }
  return toLabTest(test);
}

export async function createTest(values: TestWriteData): Promise<LabTest> {
  await assertTestWritable(values);
  const test = await withTranslatedErrors(() => testRepository.createTest(values));
  regenerateSitemapInBackground();
  return toLabTest(test);
}

export async function updateTest(id: string, values: TestWriteData): Promise<LabTest> {
  const existing = await testRepository.findTestById(id);
  if (!existing) {
    throw ApiError.notFound("Test not found");
  }
  await assertTestWritable(values, id);
  const test = await withTranslatedErrors(() => testRepository.updateTest(id, values));
  regenerateSitemapInBackground();
  return toLabTest(test);
}

/** Hard delete, guarded: appointments, packages, and price lists all reference a
 *  Test with ON DELETE RESTRICT, so a Test that's already been booked or bundled
 *  is refused with a message naming the blocker instead of a raw FK error.
 *  Setting `status` to Inactive is how a booked Test gets retired. */
export async function deleteTest(id: string): Promise<void> {
  const existing = await testRepository.findTestById(id);
  if (!existing) {
    throw ApiError.notFound("Test not found");
  }

  const usage = await testRepository.countTestUsage(id);
  const blockers = [
    usage.appointmentCount > 0
      ? `${usage.appointmentCount} appointment${usage.appointmentCount === 1 ? "" : "s"}`
      : null,
    usage.packageCount > 0
      ? `${usage.packageCount} package${usage.packageCount === 1 ? "" : "s"}`
      : null,
    usage.priceListCount > 0
      ? `${usage.priceListCount} price list${usage.priceListCount === 1 ? "" : "s"}`
      : null,
  ].filter(Boolean);

  if (blockers.length > 0) {
    throw ApiError.conflict(
      `"${existing.name}" is used by ${blockers.join(", ")} — remove it there first, or mark it inactive instead`,
    );
  }

  await withTranslatedErrors(() => testRepository.deleteTest(id));
  regenerateSitemapInBackground();
}

/** Reorders a Test's attached parameters. Ids are the `TestParameter` join-row
 *  ids, not Parameter ids — the same rows `LabTest.parameters[].id` exposes. */
export async function reorderTestParameters(
  testId: string,
  orderedIds: string[],
): Promise<LabTest> {
  const test = await testRepository.findTestById(testId);
  if (!test) {
    throw ApiError.notFound("Test not found");
  }

  const known = new Set(test.parameters.map((p) => p.id));
  const unknown = orderedIds.filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw ApiError.badRequest("One or more parameters are not attached to this test");
  }

  await testRepository.reorderTestParameters(testId, orderedIds);
  return getTest(testId);
}

/** Attaches (or, with null, detaches) the optional sample lab report. Separate
 *  from the form's Save because a multipart upload travels on its own request —
 *  same shape as `parameter.service.ts#setParameterSampleReport`. */
export async function setTestSampleReport(
  id: string,
  sampleReportUrl: string | null,
): Promise<LabTest> {
  const existing = await testRepository.findTestById(id);
  if (!existing) {
    throw ApiError.notFound("Test not found");
  }
  const test = await withTranslatedErrors(() =>
    testRepository.setTestSampleReportUrl(id, sampleReportUrl),
  );
  return toLabTest(test);
}

export async function setTestPopular(id: string, isPopular: boolean): Promise<LabTest> {
  await withTranslatedErrors(() => testRepository.setTestPopular(id, isPopular));
  return getTest(id);
}

/** Builds the Tests CSV — same column set `importTestsCsv` reads back, so
 *  Export doubles as the import template.
 *
 *  `sampleReportUrl` is deliberately absent: it's an uploaded file path, not
 *  something an admin types into a spreadsheet, and round-tripping it would let
 *  an import point a Test at an arbitrary path. */
export async function exportTestsCsv(): Promise<Buffer> {
  const { rows } = await testRepository.listTests({ skip: 0, take: 1_000_000 });

  const csvRows = rows.map((test) => ({
    Name: test.name,
    "Short Name": test.shortName,
    Category: test.appCategory?.name ?? "",
    "Sample Type": test.sampleType.name,
    Price: Number(test.price),
    "Offer Price": test.offerPrice != null ? Number(test.offerPrice) : "",
    "Report Time": test.reportTime,
    "Is Fasting Required": toYesNo(test.isFastingRequired),
    "Fasting Hours": test.fastingHours != null ? test.fastingHours : "",
    "Recommended For": test.recommendedFor,
    "Recommended Age": test.recommendedAge ?? "",
    Description: test.description ?? "",
    Status: test.status,
    Popular: toYesNo(test.isPopular),
    "Booked Count": test.bookedCount,
    "Sort Order": test.sortOrder,
    "Parameter Short Names": test.parameters.map((p) => p.parameter.shortName).join(";"),
    "Parameter IDs": test.parameters.map((p) => p.parameter.serialNo).join(","),
    "Branch Usernames": test.branchUsers.map((b) => b.user.username).join(";"),
    Department: test.department?.name ?? "",
    "Lab Category": test.category?.name ?? "",
  }));

  return toCsvBuffer(TEST_CSV_HEADERS, csvRows);
}

/** Resolves the master-data columns for one CSV row, throwing a row-friendly
 *  `ApiError` the caller turns into an error entry instead of failing the whole
 *  file.
 *
 *  Only "Sample Type" is mandatory. "Category" (the CMS tile) and the
 *  Department/"Lab Category" pair are all optional — the admin form no longer
 *  collects the internal taxonomy, so a CSV round-tripped from Export legitimately
 *  leaves those blank. A name that IS given but doesn't resolve still fails the
 *  row rather than being silently dropped. */
async function resolveTestMasterData(row: Record<string, string>) {
  const sampleTypeName = row["Sample Type"]?.trim();
  const appCategoryName = row["Category"]?.trim();
  const departmentName = row["Department"]?.trim();
  // Accepts the legacy header too: before the CMS category existed, "Category"
  // WAS the department-scoped lab category, so an older export uses that name.
  const labCategoryName = (row["Lab Category"] ?? "").trim();

  const sampleType = sampleTypeName
    ? await prisma.sampleType.findFirst({
        where: { name: { equals: sampleTypeName, mode: "insensitive" }, deletedAt: null },
      })
    : null;
  if (!sampleType) {
    throw ApiError.badRequest(`Sample Type "${sampleTypeName ?? ""}" not found`);
  }

  let appCategoryId: string | null = null;
  if (appCategoryName) {
    const appCategory = await prisma.appCategory.findFirst({
      where: { name: { equals: appCategoryName, mode: "insensitive" } },
      select: { id: true },
    });
    if (!appCategory) {
      throw ApiError.badRequest(`Category "${appCategoryName}" not found`);
    }
    appCategoryId = appCategory.id;
  }

  let departmentId: string | null = null;
  if (departmentName) {
    const department = await prisma.department.findFirst({
      where: { name: { equals: departmentName, mode: "insensitive" }, deletedAt: null },
      select: { id: true },
    });
    if (!department) {
      throw ApiError.badRequest(`Department "${departmentName}" not found`);
    }
    departmentId = department.id;
  }

  let categoryId: string | null = null;
  if (labCategoryName) {
    if (!departmentId) {
      throw ApiError.badRequest(`Lab Category "${labCategoryName}" needs a Department`);
    }
    const category = await prisma.category.findFirst({
      where: {
        name: { equals: labCategoryName, mode: "insensitive" },
        departmentId,
        deletedAt: null,
      },
      select: { id: true },
    });
    // Auto-created rather than rejected: unlike Department/Sample Type/CMS
    // Category (real master data an admin curates ahead of time), a Lab
    // Category is scoped per-department and often just labels a row's
    // internal grouping ("PANEL", "ROUTINE", ...) — a whole CSV's worth of
    // rows failing because that one label doesn't exist yet under 7-8
    // departments is a worse experience than the label simply being created
    // the first time it's used, exactly like a fresh spreadsheet import
    // would expect.
    categoryId = category
      ? category.id
      : (await prisma.category.create({ data: { name: labCategoryName, departmentId } })).id;
  }

  return { sampleTypeId: sampleType.id, appCategoryId, departmentId, categoryId };
}

/** Resolves the "Branch Usernames" column to user ids. Empty means "available at
 *  every branch" (see the `TestBranchUser` model doc-comment), so a blank column
 *  clears availability rather than erroring. */
async function resolveBranchUsernames(raw: string | undefined): Promise<string[]> {
  const usernames = normalizeShortNames((raw ?? "").split(";"));
  if (usernames.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { username: { in: usernames, mode: "insensitive" }, isActive: true },
    select: { id: true, username: true, role: { select: { name: true } } },
  });

  const ids: string[] = [];
  for (const username of usernames) {
    const matches = users.filter((u) => u.username.toLowerCase() === username.toLowerCase());
    if (matches.length === 0) {
      throw ApiError.badRequest(`Branch user "${username}" not found or inactive`);
    }
    if (matches[0].role.name !== "FRANCHISE") {
      throw ApiError.badRequest(`User "${username}" is not a branch login`);
    }
    ids.push(matches[0].id);
  }
  return ids;
}

/** Bulk create/update from a Tests CSV (see `exportTestsCsv` for the exact
 *  column shape). Matches an existing Test by "Short Name" (case-insensitive)
 *  to update it; no match creates a new Test. "Parameter Short Names" is a
 *  semicolon-separated list resolved through the same one-or-none rule as the
 *  API, in list order — so the CSV column also fixes the parameters' sortOrder.
 *  Each row is isolated in its own try/catch so one bad row is reported and
 *  skipped instead of aborting the whole file. */
export async function importTestsCsv(buffer: Buffer): Promise<CsvImportResult> {
  const rows = parseCsvBuffer(buffer);
  const result: CsvImportResult = {
    totalRows: rows.length,
    insertedCount: 0,
    updatedCount: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;
    try {
      const name = row["Name"]?.trim();
      const shortName = row["Short Name"]?.trim();
      const priceRaw = row["Price"]?.trim();
      const reportTime = row["Report Time"]?.trim();

      if (!name) throw ApiError.badRequest("Name is required");
      if (!shortName) throw ApiError.badRequest("Short Name is required");
      if (!priceRaw || Number.isNaN(Number(priceRaw)) || Number(priceRaw) <= 0) {
        throw ApiError.badRequest("Price must be a positive number");
      }
      if (!reportTime) throw ApiError.badRequest("Report Time is required");

      const { departmentId, categoryId, appCategoryId, sampleTypeId } =
        await resolveTestMasterData(row);

      // "Parameter IDs" (a comma-separated list) takes priority over
      // "Parameter Short Names" when present. Two real shapes show up in
      // practice: usually it's Parameter S.No values (see
      // `resolveParameterSerialNos`'s doc-comment) — but some source rows
      // (seen in real allergy-panel exports) put comma-separated short
      // names/allergen labels in this same column instead, with "Parameter
      // Short Names" left blank for that row. Rather than hard-failing the
      // row, only the S.No path is taken when EVERY entry parses as a
      // positive whole number; otherwise the whole list is treated as short
      // names (comma-, not semicolon-, separated here).
      const parameterIdsRaw = row["Parameter IDs"]?.trim();
      // Collects anything named in this row's parameter columns that didn't
      // resolve — the row still imports with whatever DID resolve attached;
      // see `resolveParameterSerialNos`/`resolveParameterShortNames`'s
      // `skipMissing` doc-comments. Surfaced as a per-row warning below
      // rather than failing the whole row over one absent analyte.
      const missingParams: (string | number)[] = [];
      let parameterIds: string[];
      if (parameterIdsRaw) {
        const tokens = parameterIdsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const allNumeric = tokens.every((s) => Number.isInteger(Number(s)) && Number(s) >= 1);
        parameterIds = allNumeric
          ? await resolveParameterSerialNos(tokens.map(Number), {
              skipMissing: true,
              missingOut: missingParams as number[],
            })
          : await resolveParameterShortNames(normalizeShortNames(tokens), {
              skipMissing: true,
              missingOut: missingParams as string[],
            });
      } else {
        const parameterShortNames = normalizeShortNames(
          (row["Parameter Short Names"]?.trim() ?? "").split(";"),
        );
        parameterIds = await resolveParameterShortNames(parameterShortNames, {
          skipMissing: true,
          missingOut: missingParams as string[],
        });
      }
      const branchUserIds = await resolveBranchUsernames(row["Branch Usernames"]);

      const offerPriceRaw = row["Offer Price"]?.trim();
      const statusRaw = row["Status"]?.trim();
      const status: TestStatus = statusRaw?.toLowerCase() === "inactive" ? "Inactive" : "Active";
      const fastingHoursRaw = row["Fasting Hours"]?.trim();
      const isFastingRequired = parseYesNo(row["Is Fasting Required"], false);

      const recommendedForRaw = row["Recommended For"]?.trim().toUpperCase();
      if (
        recommendedForRaw &&
        !RECOMMENDED_GENDERS.includes(recommendedForRaw as RecommendedGender)
      ) {
        throw ApiError.badRequest(
          `Recommended For must be one of: ${RECOMMENDED_GENDERS.join(", ")}`,
        );
      }

      const values: TestWriteData = {
        name,
        shortName,
        departmentId,
        categoryId,
        appCategoryId,
        sampleTypeId,
        price: Number(priceRaw),
        reportTime,
        description: row["Description"]?.trim() || null,
        status,
        offerPrice: offerPriceRaw ? Number(offerPriceRaw) : null,
        isPopular: parseYesNo(row["Popular"], false),
        ...(row["Booked Count"]?.trim() ? { bookedCount: Number(row["Booked Count"].trim()) } : {}),
        // "Sort_Order" (underscore) accepted alongside "Sort Order" — some
        // external exports use the underscore form.
        ...((row["Sort Order"] ?? row["Sort_Order"])?.trim()
          ? { sortOrder: Number((row["Sort Order"] ?? row["Sort_Order"]).trim()) }
          : {}),
        isFastingRequired,
        fastingHours: isFastingRequired && fastingHoursRaw ? Number(fastingHoursRaw) : null,
        recommendedFor: (recommendedForRaw as RecommendedGender) || "BOTH",
        recommendedAge: row["Recommended Age"]?.trim() || null,
        parameters: parameterIds.map((parameterId) => ({ parameterId })),
        branchUserIds,
      };

      const matches = await testRepository.findTestsByShortName(shortName);
      if (matches.length > 1) {
        throw ApiError.badRequest(
          `Short name "${shortName}" matches ${matches.length} existing tests`,
        );
      }

      if (matches.length === 1) {
        await updateTest(matches[0].id, values);
        result.updatedCount++;
      } else {
        await createTest(values);
        result.insertedCount++;
      }

      if (missingParams.length > 0) {
        (result.warnings ??= []).push({
          row: rowNumber,
          message: `Skipped ${missingParams.length} parameter(s) not found: ${missingParams.join(", ")}`,
        });
      }
    } catch (error) {
      result.errors.push({
        row: rowNumber,
        message: error instanceof ApiError ? error.message : "Something went wrong on this row",
      });
    }
  }

  return result;
}

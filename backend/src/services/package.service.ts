import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { parseCsvBuffer, toCsvBuffer } from "../utils/csv";
import * as packageRepository from "../repositories/package.repository";
import { toPackageDto } from "../repositories/package.repository";
import { regenerateSitemapInBackground } from "./sitemapGenerator.service";
import {
  assertOfferPriceNotAbovePrice,
  assertParameterIdsUsable,
  assertTestIdsUsable,
  resolveParameterSerialNos,
  resolveParameterShortNames,
  resolveTestSerialNos,
  resolveTestShortNames,
} from "./catalogShortName";
import type {
  ListPackagesParams,
  ListPackagesResult,
  PackageDto,
  PackageWriteData,
  PackageWriteRecord,
  RecommendedGender,
} from "../types/package.types";
import type { CsvImportResult } from "../types/csvImport.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const PACKAGE_CSV_HEADERS = [
  "Name",
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
  "Active",
  "Popular",
  "Booked Count",
  "Sort Order",
  "Test Short Names",
  "Test IDs",
  "Parameter Short Names",
  "Parameter IDs",
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

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Package not found");
      }
      if (error.code === "P2002") {
        throw ApiError.conflict("A package with this name already exists");
      }
      if (error.code === "P2003") {
        throw ApiError.badRequest("One or more selected tests or parameters do not exist");
      }
    }
    throw error;
  }
}

/** The two FK dropdowns are validated server-side so a deactivated master row
 *  can't be attached just because a stale form still had its id — same rule as
 *  `parameter.service.ts#assertMasterDataUsable`. */
async function assertMasterDataUsable(values: PackageWriteData): Promise<void> {
  if (values.appCategoryId) {
    const appCategory = await prisma.appCategory.findUnique({
      where: { id: values.appCategoryId },
      select: { name: true, isActive: true },
    });
    if (!appCategory) {
      throw ApiError.badRequest("Selected category does not exist");
    }
    if (!appCategory.isActive) {
      throw ApiError.badRequest(`Category "${appCategory.name}" is inactive`);
    }
  }

  if (values.sampleTypeId) {
    const sampleType = await prisma.sampleType.findFirst({
      where: { id: values.sampleTypeId, deletedAt: null },
      select: { name: true, active: true },
    });
    if (!sampleType) {
      throw ApiError.badRequest("Selected sample type does not exist");
    }
    if (!sampleType.active) {
      throw ApiError.badRequest(`Sample type "${sampleType.name}" is inactive`);
    }
  }
}

/** Fasting hours only mean something when fasting is actually required — same
 *  rule as the Test and Parameter forms, so all three behave identically. */
function assertFastingConsistent(values: PackageWriteData): void {
  if (values.isFastingRequired && values.fastingHours != null && values.fastingHours <= 0) {
    throw ApiError.badRequest("Fasting hours must be greater than zero");
  }
  if (!values.isFastingRequired && values.fastingHours != null && values.fastingHours > 0) {
    throw ApiError.badRequest("Turn on 'Is Fasting Required' before setting fasting hours");
  }
}

/** Turns whatever membership the caller supplied — ids, short names, or a mix —
 *  into the id-only `PackageWriteRecord` the repository writes.
 *
 *  This is the ONLY place a package's short names are ever read. They're
 *  resolved once, here, and every downstream consumer (billing,
 *  `expandToTestIds`, reports, the app catalogue) sees nothing but FK ids. A
 *  name that doesn't resolve to exactly one active row fails the whole request
 *  rather than being approximated — see `catalogShortName.ts`.
 *
 *  Parameters go through `requireDoTest`: a Package may only pull in analytes
 *  that are independently bookable, since a non-bookable one has no meaning
 *  outside the Test that hosts it. */
async function resolveMembership(values: PackageWriteData): Promise<PackageWriteRecord> {
  assertOfferPriceNotAbovePrice(values.price, values.offerPrice);
  assertFastingConsistent(values);
  await assertMasterDataUsable(values);

  const testIdsFromNames = values.testShortNames?.length
    ? await resolveTestShortNames(values.testShortNames)
    : [];
  const parameterIdsFromNames = values.parameterShortNames?.length
    ? await resolveParameterShortNames(values.parameterShortNames, { requireDoTest: true })
    : [];

  const directTestIds = values.testIds ?? [];
  const directParameterIds = values.parameterIds ?? [];
  await assertTestIdsUsable(directTestIds);
  await assertParameterIdsUsable(directParameterIds, { requireDoTest: true });

  const testIds = [...new Set([...directTestIds, ...testIdsFromNames])];
  const parameterIds = [...new Set([...directParameterIds, ...parameterIdsFromNames])];

  if (testIds.length === 0 && parameterIds.length === 0) {
    throw ApiError.badRequest("Add at least one test or one bookable parameter to the package");
  }

  return {
    name: values.name,
    price: values.price,
    appCategoryId: values.appCategoryId,
    sampleTypeId: values.sampleTypeId,
    description: values.description,
    reportTime: values.reportTime,
    isFastingRequired: values.isFastingRequired,
    fastingHours: values.fastingHours,
    followUpDays: values.followUpDays,
    followUpTemplate: values.followUpTemplate,
    recommendedFor: values.recommendedFor,
    recommendedAge: values.recommendedAge,
    testIds,
    parameterIds,
    active: values.active,
    offerPrice: values.offerPrice,
    isPopular: values.isPopular,
    bookedCount: values.bookedCount,
    sortOrder: values.sortOrder,
  };
}

export async function listPackages(params: ListPackagesParams): Promise<ListPackagesResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await packageRepository.listPackages({
    search: params.search,
    active: params.active,
    includeDeleted: params.includeDeleted === "true",
    appCategoryId: params.appCategoryId,
    sampleTypeId: params.sampleTypeId,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toPackageDto), total };
}

export async function getPackage(id: string): Promise<PackageDto> {
  const pkg = await packageRepository.findPackageById(id);
  if (!pkg) {
    throw ApiError.notFound("Package not found");
  }
  return toPackageDto(pkg);
}

export async function createPackage(values: PackageWriteData): Promise<PackageDto> {
  const record = await resolveMembership(values);
  const pkg = await withTranslatedErrors(() => packageRepository.createPackage(record));
  regenerateSitemapInBackground();
  return toPackageDto(pkg);
}

export async function updatePackage(id: string, values: PackageWriteData): Promise<PackageDto> {
  const existing = await packageRepository.findPackageById(id);
  if (!existing) {
    throw ApiError.notFound("Package not found");
  }
  const record = await resolveMembership(values);
  const pkg = await withTranslatedErrors(() => packageRepository.updatePackage(id, record));
  regenerateSitemapInBackground();
  return toPackageDto(pkg);
}

export async function deletePackage(id: string): Promise<void> {
  await withTranslatedErrors(() => packageRepository.softDeletePackage(id));
  regenerateSitemapInBackground();
}

export async function restorePackage(id: string): Promise<PackageDto> {
  const pkg = await withTranslatedErrors(() => packageRepository.restorePackage(id));
  regenerateSitemapInBackground();
  return getPackage(pkg.id);
}

export async function setPackageStatus(id: string, active: boolean): Promise<PackageDto> {
  const pkg = await withTranslatedErrors(() => packageRepository.setPackageStatus(id, active));
  regenerateSitemapInBackground();
  return getPackage(pkg.id);
}

export async function setPackagePopular(id: string, isPopular: boolean): Promise<PackageDto> {
  const pkg = await withTranslatedErrors(() => packageRepository.setPackagePopular(id, isPopular));
  return getPackage(pkg.id);
}

/** Attaches (or, with null, detaches) the optional sample lab report. Separate
 *  from the form's Save because a multipart upload travels on its own request. */
export async function setPackageSampleReport(
  id: string,
  sampleReportUrl: string | null,
): Promise<PackageDto> {
  const existing = await packageRepository.findPackageById(id);
  if (!existing) {
    throw ApiError.notFound("Package not found");
  }
  const pkg = await withTranslatedErrors(() =>
    packageRepository.setPackageSampleReportUrl(id, sampleReportUrl),
  );
  return toPackageDto(pkg);
}

/** Builds the Packages CSV — same column set `importPackagesCsv` reads back,
 *  so Export doubles as the import template. */
export async function exportPackagesCsv(): Promise<Buffer> {
  const packages = await packageRepository.findAllPackagesForExport();

  const rows = packages.map((pkg) => {
    const dto = toPackageDto(pkg);
    return {
      Name: dto.name,
      Category: dto.appCategory ?? "",
      "Sample Type": dto.sampleType ?? "",
      Price: dto.price,
      "Offer Price": dto.offerPrice != null ? dto.offerPrice : "",
      "Report Time": dto.reportTime ?? "",
      "Is Fasting Required": toYesNo(dto.isFastingRequired),
      "Fasting Hours": dto.fastingHours != null ? dto.fastingHours : "",
      "Recommended For": dto.recommendedFor,
      "Recommended Age": dto.recommendedAge ?? "",
      Description: dto.description ?? "",
      Active: toYesNo(dto.active),
      Popular: toYesNo(dto.isPopular),
      "Booked Count": dto.bookedCount,
      "Sort Order": dto.sortOrder,
      "Test Short Names": dto.tests.map((t) => t.testShortName).join(";"),
      "Test IDs": dto.tests.map((t) => t.testSerialNo).join(","),
      "Parameter Short Names": dto.parameters.map((p) => p.parameterShortName).join(";"),
      "Parameter IDs": dto.parameters.map((p) => p.parameterSerialNo).join(","),
    };
  });

  return toCsvBuffer(PACKAGE_CSV_HEADERS, rows);
}

/** Resolves the Category and Sample Type columns by name for one CSV row. Both
 *  are optional — a package needn't declare either — but a name that IS given
 *  and doesn't resolve fails the row rather than being dropped silently. */
async function resolvePackageMasterData(row: Record<string, string>) {
  const categoryName = row["Category"]?.trim();
  const sampleTypeName = row["Sample Type"]?.trim();

  let appCategoryId: string | null = null;
  if (categoryName) {
    const appCategory = await prisma.appCategory.findFirst({
      where: { name: { equals: categoryName, mode: "insensitive" } },
      select: { id: true },
    });
    if (!appCategory) {
      throw ApiError.badRequest(`Category "${categoryName}" not found`);
    }
    appCategoryId = appCategory.id;
  }

  let sampleTypeId: string | null = null;
  if (sampleTypeName) {
    const sampleType = await prisma.sampleType.findFirst({
      where: { name: { equals: sampleTypeName, mode: "insensitive" }, deletedAt: null },
      select: { id: true },
    });
    if (!sampleType) {
      throw ApiError.badRequest(`Sample Type "${sampleTypeName}" not found`);
    }
    sampleTypeId = sampleType.id;
  }

  return { appCategoryId, sampleTypeId };
}

/** Bulk create/update from a Packages CSV (see `exportPackagesCsv` for the
 *  exact column shape). Matches an existing Package by "Name"
 *  (case-insensitive) to update it; no match creates a new Package.
 *
 *  Membership can be given either way, and both are read together (a package
 *  can mix a short-name core with an S.No-based add-on): "Test/Parameter
 *  Short Names" are semicolon-separated names going through the same
 *  resolver the API uses, and "Test/Parameter IDs" are comma-separated
 *  `serialNo` ("S.No") values — the same cross-reference scheme
 *  `test.service.ts#importTestsCsv`'s "Parameter IDs" column uses — for a
 *  source sheet that numbers its Tests/Parameters instead of naming them. An
 *  unknown or ambiguous short name still fails the row, but a missing S.No is
 *  lenient: it's dropped and reported as a warning (see `missingOut` on
 *  `resolveTestSerialNos`/`resolveParameterSerialNos`) so the rest of the
 *  package's membership still imports rather than the whole row failing over
 *  one absent reference. */
export async function importPackagesCsv(buffer: Buffer): Promise<CsvImportResult> {
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
      const priceRaw = row["Price"]?.trim();

      if (!name) throw ApiError.badRequest("Name is required");
      if (!priceRaw || Number.isNaN(Number(priceRaw)) || Number(priceRaw) < 0) {
        throw ApiError.badRequest("Price must be a number");
      }

      const { appCategoryId, sampleTypeId } = await resolvePackageMasterData(row);

      const offerPriceRaw = row["Offer Price"]?.trim();
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

      // "Test IDs"/"Parameter IDs" are comma-separated `serialNo` values —
      // see the function doc-comment above. A S.No with no match is dropped
      // (not a row failure) and recorded so it can be surfaced as a warning.
      const missingTests: number[] = [];
      const testIdTokens = (row["Test IDs"]?.trim() ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number);
      const testIdsFromSerialNos = testIdTokens.length
        ? await resolveTestSerialNos(testIdTokens, { skipMissing: true, missingOut: missingTests })
        : [];

      const missingParams: number[] = [];
      const parameterIdTokens = (row["Parameter IDs"]?.trim() ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number);
      const parameterIdsFromSerialNos = parameterIdTokens.length
        ? await resolveParameterSerialNos(parameterIdTokens, {
            requireDoTest: true,
            skipMissing: true,
            missingOut: missingParams,
          })
        : [];

      const values: PackageWriteData = {
        name,
        price: Number(priceRaw),
        appCategoryId,
        sampleTypeId,
        description: row["Description"]?.trim() || null,
        reportTime: row["Report Time"]?.trim() || null,
        isFastingRequired,
        fastingHours: isFastingRequired && fastingHoursRaw ? Number(fastingHoursRaw) : null,
        recommendedFor: (recommendedForRaw as RecommendedGender) || "BOTH",
        recommendedAge: row["Recommended Age"]?.trim() || null,
        testShortNames: (row["Test Short Names"]?.trim() ?? "").split(";"),
        testIds: testIdsFromSerialNos,
        parameterShortNames: (row["Parameter Short Names"]?.trim() ?? "").split(";"),
        parameterIds: parameterIdsFromSerialNos,
        active: parseYesNo(row["Active"], true),
        offerPrice: offerPriceRaw ? Number(offerPriceRaw) : null,
        isPopular: parseYesNo(row["Popular"], false),
        ...(row["Booked Count"]?.trim() ? { bookedCount: Number(row["Booked Count"].trim()) } : {}),
        // "Sort_Order" (underscore) accepted alongside "Sort Order" — some
        // external exports use the underscore form.
        ...((row["Sort Order"] ?? row["Sort_Order"])?.trim()
          ? { sortOrder: Number((row["Sort Order"] ?? row["Sort_Order"]).trim()) }
          : {}),
      };

      const existing = await packageRepository.findPackageByName(name);
      if (existing) {
        await updatePackage(existing.id, values);
        result.updatedCount++;
      } else {
        await createPackage(values);
        result.insertedCount++;
      }

      if (missingTests.length > 0 || missingParams.length > 0) {
        const parts: string[] = [];
        if (missingTests.length) {
          parts.push(`${missingTests.length} test(s) not found: ${missingTests.join(", ")}`);
        }
        if (missingParams.length) {
          parts.push(`${missingParams.length} parameter(s) not found: ${missingParams.join(", ")}`);
        }
        (result.warnings ??= []).push({ row: rowNumber, message: `Skipped ${parts.join("; ")}` });
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

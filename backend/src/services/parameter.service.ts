import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { parseCsvBuffer, toCsvBuffer } from "../utils/csv";
import * as parameterRepository from "../repositories/parameter.repository";
import { toParameterDto } from "../repositories/parameter.repository";
import {
  assertOfferPriceNotAbovePrice,
  assertParameterShortNameAvailable,
} from "./catalogShortName";
import { ensureShadowTestForParameter } from "./shadowTest.service";
import type {
  ListParametersParams,
  ListParametersResult,
  ParameterDto,
  ParameterWriteData,
  RecommendedGender,
  SampleCollectionMode,
} from "../types/parameter.types";
import type { CsvImportResult } from "../types/csvImport.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const PARAMETER_CSV_HEADERS = [
  "S.No",
  "Name",
  "Short Name",
  "Sample Type",
  "Department",
  "Category",
  "MRP",
  "Offer Price",
  "Report Time",
  "Sample Collection",
  "Is Fasting Required",
  "Fasting Hours",
  "Recommended For",
  "Recommended Age",
  "Description",
  "Do Test",
  "Commonly Used",
  "Sort Order",
  "Active",
];

const SAMPLE_COLLECTION_MODES: SampleCollectionMode[] = ["HOME", "LAB", "BOTH"];
const RECOMMENDED_GENDERS: RecommendedGender[] = ["MALE", "FEMALE", "BOTH"];

function toYesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function parseYesNo(value: string | undefined, fallback: boolean): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return fallback;
  return normalized === "yes" || normalized === "true" || normalized === "1";
}

/** Prisma's "record not found" (P2025) becomes the same 404 a missing GET would
 *  return; the unique-index violation (P2002) becomes the same 409 the
 *  case-insensitive pre-check raises, covering the race between the two. */
async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Parameter not found");
      }
      if (error.code === "P2002") {
        const target = error.meta?.target;
        const targetStr = Array.isArray(target) ? target.join(",") : String(target ?? "");
        throw ApiError.conflict(
          targetStr.includes("serial_no")
            ? "This S.No is already used by another parameter"
            : "A parameter with this short name already exists",
        );
      }
      if (error.code === "P2003") {
        throw ApiError.badRequest("Selected sample type or category does not exist");
      }
    }
    throw error;
  }
}

/** The two FK dropdowns are validated here rather than trusted from the client:
 *  a soft-deleted or deactivated master row must not become selectable just
 *  because a stale form still had its id. */
async function assertMasterDataUsable(values: ParameterWriteData): Promise<void> {
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

  if (values.departmentId) {
    const department = await prisma.department.findFirst({
      where: { id: values.departmentId, deletedAt: null },
      select: { name: true, active: true },
    });
    if (!department) {
      throw ApiError.badRequest("Selected department does not exist");
    }
    if (!department.active) {
      throw ApiError.badRequest(`Department "${department.name}" is inactive`);
    }
  }
}

/** Fasting hours only mean something when fasting is actually required — a
 *  payload that sets hours without the flag is a contradiction, not a default to
 *  silently resolve. */
function assertFastingConsistent(values: ParameterWriteData): void {
  if (values.isFastingRequired && values.fastingHours != null && values.fastingHours <= 0) {
    throw ApiError.badRequest("Fasting hours must be greater than zero");
  }
  if (!values.isFastingRequired && values.fastingHours != null && values.fastingHours > 0) {
    throw ApiError.badRequest("Turn on 'Is Fasting Required' before setting fasting hours");
  }
}

/** "Commonly Used" only means something for a Parameter that's independently
 *  bookable in the first place — it decides whether this Parameter's shadow
 *  Test (see `Test.sourceParameterId`) shows up in the patient app's Tests
 *  browse, which only exists at all when `doTest` is on. */
function assertCommonlyUsedConsistent(values: ParameterWriteData): void {
  if (values.isCommonlyUsed && values.doTest === false) {
    throw ApiError.badRequest("Turn on 'Do Test' before marking this Commonly Used");
  }
}

interface AssertParameterWritableOptions {
  /** CSV import skips this — a spreadsheet copied from elsewhere legitimately
   *  carries an offer price above MRP sometimes (a since-updated MRP, a
   *  transcription order swap, ...), and rejecting the whole row for it turns
   *  a one-line fix into a re-export/re-upload round trip. The admin form
   *  still enforces it, same as `Package`/`Test`. */
  skipOfferPriceCheck?: boolean;
}

async function assertParameterWritable(
  values: ParameterWriteData,
  excludeId?: string,
  options: AssertParameterWritableOptions = {},
): Promise<void> {
  if (!options.skipOfferPriceCheck) {
    assertOfferPriceNotAbovePrice(values.price, values.offerPrice);
  }
  assertFastingConsistent(values);
  assertCommonlyUsedConsistent(values);
  await assertMasterDataUsable(values);
  await assertParameterShortNameAvailable(values.shortName, excludeId);
}

export async function listParameters(params: ListParametersParams): Promise<ListParametersResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await parameterRepository.listParameters({
    search: params.search,
    doTest: params.doTest,
    active: params.active,
    sampleTypeId: params.sampleTypeId,
    departmentId: params.departmentId,
    appCategoryId: params.appCategoryId,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toParameterDto), total };
}

export async function getParameter(id: string): Promise<ParameterDto> {
  const parameter = await parameterRepository.findParameterById(id);
  if (!parameter) {
    throw ApiError.notFound("Parameter not found");
  }
  return toParameterDto(parameter);
}

export async function createParameter(
  values: ParameterWriteData,
  options: AssertParameterWritableOptions = {},
): Promise<ParameterDto> {
  await assertParameterWritable(values, undefined, options);
  const created = await withTranslatedErrors(() => parameterRepository.createParameter(values));
  await ensureShadowTestForParameter(created.id);
  return toParameterDto(created);
}

export async function updateParameter(
  id: string,
  values: ParameterWriteData,
  options: AssertParameterWritableOptions = {},
): Promise<ParameterDto> {
  await assertParameterWritable(values, id, options);
  const updated = await withTranslatedErrors(() => parameterRepository.updateParameter(id, values));
  await ensureShadowTestForParameter(updated.id);
  return toParameterDto(updated);
}

/** Attaches an uploaded sample-report file to a Parameter. Separate from the
 *  form's Save because multipart uploads travel on their own request; passing
 *  `null` detaches the current file. */
export async function setParameterSampleReport(
  id: string,
  sampleReportUrl: string | null,
): Promise<ParameterDto> {
  const existing = await parameterRepository.findParameterById(id);
  if (!existing) {
    throw ApiError.notFound("Parameter not found");
  }
  const updated = await withTranslatedErrors(() =>
    parameterRepository.setParameterSampleReportUrl(id, sampleReportUrl),
  );
  return toParameterDto(updated);
}

/** Hard delete, guarded: both joins that reference a Parameter are ON DELETE
 *  RESTRICT, so a Parameter still attached to a Test or sold by a Package is
 *  refused with a message naming the blocker rather than a raw FK error.
 *  Turning `active` off is the way to retire one that's in use. */
export async function deleteParameter(id: string): Promise<void> {
  const existing = await parameterRepository.findParameterById(id);
  if (!existing) {
    throw ApiError.notFound("Parameter not found");
  }

  const { testCount, packageCount } = await parameterRepository.countParameterUsage(id);
  if (testCount > 0 || packageCount > 0) {
    const blockers = [
      testCount > 0 ? `${testCount} test${testCount === 1 ? "" : "s"}` : null,
      packageCount > 0 ? `${packageCount} package${packageCount === 1 ? "" : "s"}` : null,
    ].filter(Boolean);
    throw ApiError.conflict(
      `"${existing.name}" is used by ${blockers.join(" and ")} — detach it there first, or mark it inactive instead`,
    );
  }

  await withTranslatedErrors(() => parameterRepository.deleteParameter(id));
}

/** Builds the Parameters CSV — same column set `importParametersCsv` reads back,
 *  so Export doubles as the import template.
 *
 *  `sampleReportUrl` is deliberately absent: it's an uploaded file path, not
 *  something an admin can meaningfully type into a spreadsheet, and round-tripping
 *  it would let an import point a Parameter at an arbitrary path. */
export async function exportParametersCsv(): Promise<Buffer> {
  const rows = await parameterRepository.findAllParametersForExport();

  const csvRows = rows.map((row) => {
    const dto = toParameterDto(row);
    return {
      "S.No": dto.serialNo,
      Name: dto.name,
      "Short Name": dto.shortName,
      "Sample Type": dto.sampleType ?? "",
      Department: dto.department ?? "",
      Category: dto.appCategory ?? "",
      MRP: dto.price,
      "Offer Price": dto.offerPrice != null ? dto.offerPrice : "",
      "Report Time": dto.reportTime ?? "",
      "Sample Collection": dto.sampleCollection,
      "Is Fasting Required": toYesNo(dto.isFastingRequired),
      "Fasting Hours": dto.fastingHours != null ? dto.fastingHours : "",
      "Recommended For": dto.recommendedFor,
      "Recommended Age": dto.recommendedAge ?? "",
      Description: dto.description ?? "",
      "Do Test": toYesNo(dto.doTest),
      "Commonly Used": toYesNo(dto.isCommonlyUsed),
      "Sort Order": dto.sortOrder,
      Active: toYesNo(dto.active),
    };
  });

  return toCsvBuffer(PARAMETER_CSV_HEADERS, csvRows);
}

/** Resolves the Sample Type, Category and Department columns by name for one
 *  CSV row. All three are optional in the CSV (a purely-nested analyte has
 *  none), but a name that IS given and doesn't resolve fails the row rather
 *  than being dropped silently. */
async function resolveParameterMasterData(row: Record<string, string>) {
  const sampleTypeName = row["Sample Type"]?.trim();
  const categoryName = row["Category"]?.trim();
  const departmentName = row["Department"]?.trim();

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

  return { sampleTypeId, appCategoryId, departmentId };
}

function parseEnumColumn<T extends string>(
  raw: string | undefined,
  allowed: T[],
  fallback: T,
  label: string,
): T {
  const value = raw?.trim().toUpperCase();
  if (!value) return fallback;
  if (!allowed.includes(value as T)) {
    throw ApiError.badRequest(`${label} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

/** Bulk create/update from a Parameters CSV (see `exportParametersCsv` for the
 *  exact column shape). "Short Name" (case-insensitive) is the upsert key — a
 *  match updates the existing Parameter, no match creates a new one. Each row is
 *  isolated in its own try/catch so one bad row is reported and skipped instead
 *  of aborting the whole file. */
export async function importParametersCsv(buffer: Buffer): Promise<CsvImportResult> {
  const rows = parseCsvBuffer(buffer);
  const result: CsvImportResult = {
    totalRows: rows.length,
    insertedCount: 0,
    updatedCount: 0,
    errors: [],
  };

  // "999" is this source file's own sentinel for "no sort order assigned
  // yet" — real exports carry 100+ rows with it. Importing that literally
  // would clump every one of them onto the exact same sortOrder instead of
  // the "goes last, unordered" the sentinel actually means, and it's NOT
  // reliably past every real value in the file (some legitimate rows sort
  // past 700-800). So every "999" row instead gets its own sortOrder,
  // continuing upward from the highest REAL (non-999) value anywhere in
  // this file, assigned in the order rows appear — unique per row, every
  // one still imported (never skipped), and all landing after every
  // explicitly-ordered row.
  const SENTINEL_SORT_ORDER = 999;
  const rawSortOrders: Array<number | null> = rows.map((row) => {
    const raw = (row["Sort Order"] ?? row["Sort_Order"])?.trim();
    return raw ? Number(raw) : null;
  });
  const maxRealSortOrder = rawSortOrders.reduce<number>(
    (max, value) => (value !== null && value !== SENTINEL_SORT_ORDER && value > max ? value : max),
    0,
  );
  let nextSentinelSortOrder = maxRealSortOrder + 1;
  const resolvedSortOrders: Array<number | null> = rawSortOrders.map((value) =>
    value === SENTINEL_SORT_ORDER ? nextSentinelSortOrder++ : value,
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;
    try {
      const name = row["Name"]?.trim();
      const shortName = row["Short Name"]?.trim();
      // "MRP" is the current header; "Price" is accepted so a CSV exported
      // before this column was renamed still imports.
      const priceRaw = (row["MRP"] ?? row["Price"])?.trim();

      if (!name) throw ApiError.badRequest("Name is required");
      if (!shortName) throw ApiError.badRequest("Short Name is required");
      if (!priceRaw || Number.isNaN(Number(priceRaw)) || Number(priceRaw) < 0) {
        throw ApiError.badRequest("MRP must be a number");
      }

      const serialNoRaw = row["S.No"]?.trim();
      if (serialNoRaw && (!Number.isInteger(Number(serialNoRaw)) || Number(serialNoRaw) < 1)) {
        throw ApiError.badRequest("S.No must be a positive whole number");
      }
      const resolvedSortOrder = resolvedSortOrders[i];

      const { sampleTypeId, appCategoryId, departmentId } = await resolveParameterMasterData(row);

      const offerPriceRaw = row["Offer Price"]?.trim();
      const fastingHoursRaw = row["Fasting Hours"]?.trim();
      const isFastingRequired = parseYesNo(row["Is Fasting Required"], false);

      const values: ParameterWriteData = {
        name,
        shortName,
        price: Number(priceRaw),
        offerPrice: offerPriceRaw ? Number(offerPriceRaw) : null,
        doTest: parseYesNo(row["Do Test"], false),
        isCommonlyUsed: parseYesNo(row["Commonly Used"], false),
        // Precomputed above — resolves the "999" sentinel to a real,
        // unique, always-last value; a genuine sortOrder passes through
        // unchanged; no column at all stays unset.
        ...(resolvedSortOrder != null ? { sortOrder: resolvedSortOrder } : {}),
        // "S.No" here becomes the real `serialNo` (not just display data) —
        // see `ParameterWriteData.serialNo`'s doc-comment: a Test CSV's own
        // "Parameter IDs" column cross-references this exact number, so an
        // imported Parameter must land on the S.No its own source file gave
        // it, not whatever the DB's autoincrement would have picked next.
        ...(serialNoRaw ? { serialNo: Number(serialNoRaw) } : {}),
        sampleTypeId,
        departmentId,
        appCategoryId,
        reportTime: row["Report Time"]?.trim() || null,
        sampleCollection: parseEnumColumn(
          row["Sample Collection"],
          SAMPLE_COLLECTION_MODES,
          "BOTH",
          "Sample Collection",
        ),
        isFastingRequired,
        fastingHours: isFastingRequired && fastingHoursRaw ? Number(fastingHoursRaw) : null,
        recommendedFor: parseEnumColumn(
          row["Recommended For"],
          RECOMMENDED_GENDERS,
          "BOTH",
          "Recommended For",
        ),
        recommendedAge: row["Recommended Age"]?.trim() || null,
        description: row["Description"]?.trim() || null,
        active: parseYesNo(row["Active"], true),
      };

      // S.No (when given) is the primary upsert key, checked BEFORE Short
      // Name. Real source files reuse the same placeholder Short Name
      // ("B", "M", "N", "P", "R", ...) across many genuinely distinct
      // informational analytes (Basophils/Bacteria/Bilirubin/Blood all as
      // "B", say) — matching by Short Name alone would silently collapse
      // every one of them onto whichever row happened to import last. S.No
      // has no such collisions in a well-formed source file, so a row whose
      // S.No already exists in the DB is unambiguously "the same analyte,
      // being re-imported" regardless of what its Short Name says.
      const existingBySerialNo = serialNoRaw
        ? await prisma.parameter.findUnique({ where: { serialNo: Number(serialNoRaw) } })
        : null;

      if (existingBySerialNo) {
        await updateParameter(existingBySerialNo.id, values, { skipOfferPriceCheck: true });
        result.updatedCount++;
      } else {
        // No S.No to key off (or this S.No is new) — fall back to Short
        // Name. Reuses the same one-or-none rule as the resolvers: >1 match
        // means the catalogue is already ambiguous and the row is
        // reported, not guessed at. Exactly one match that belongs to a
        // DIFFERENT S.No is the placeholder-collision case above — rather
        // than overwrite that unrelated analyte, this row gets its own
        // disambiguated Short Name and becomes a new row instead.
        const matches = await parameterRepository.findParametersByShortName(shortName);
        if (matches.length > 1) {
          throw ApiError.badRequest(
            `Short name "${shortName}" matches ${matches.length} existing parameters`,
          );
        }

        const collidesWithDifferentAnalyte =
          matches.length === 1 && serialNoRaw && matches[0].serialNo !== Number(serialNoRaw);

        // Offer-price-above-MRP is skipped here (see the option's own
        // doc-comment) — everything else `createParameter`/`updateParameter`
        // check still applies to an imported row.
        if (matches.length === 1 && !collidesWithDifferentAnalyte) {
          await updateParameter(matches[0].id, values, { skipOfferPriceCheck: true });
          result.updatedCount++;
        } else {
          await createParameter(
            {
              ...values,
              shortName: collidesWithDifferentAnalyte
                ? `${shortName}-${serialNoRaw}`
                : values.shortName,
            },
            { skipOfferPriceCheck: true },
          );
          result.insertedCount++;
        }
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

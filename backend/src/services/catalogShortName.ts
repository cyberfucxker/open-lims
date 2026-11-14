import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";

/** Short-name resolution for the catalogue, in one place.
 *
 *  Short names are a WRITE-TIME convenience only — they exist so the admin UI
 *  and CSV import can express "put CBC in this package" without knowing a uuid.
 *  Every function here converts names to ids once and hands back ids; no
 *  read, billing, or report path ever matches on a short name again.
 *
 *  The rule that makes this safe: a name must resolve to EXACTLY ONE active
 *  row, or the whole request is rejected. Silently taking the first of several
 *  matches is what let a package end up pointing at the wrong "CBC" before this
 *  module existed, so "ambiguous" is treated as just as invalid as "missing". */

/** Trims, drops blanks, and collapses case-insensitive duplicates while keeping
 *  the caller's order — so `["CBC", "cbc "]` is one name, not two lookups that
 *  would then trip the unique constraint on the join. */
export function normalizeShortNames(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

/** Rejects a short name that is already taken by another row, case-insensitively.
 *  The DB's own unique index only catches exact-case collisions, so "cbc"
 *  alongside "CBC" would otherwise slip through and reintroduce the ambiguity
 *  the resolvers below are built to refuse. `excludeId` skips the row being
 *  edited so saving a Test without renaming it isn't a conflict with itself. */
export async function assertTestShortNameAvailable(
  shortName: string,
  excludeId?: string,
): Promise<void> {
  const clash = await prisma.test.findFirst({
    where: {
      shortName: { equals: shortName, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { shortName: true },
  });
  if (clash) {
    throw ApiError.conflict(`Short name "${clash.shortName}" is already used by another test`);
  }
}

export async function assertParameterShortNameAvailable(
  shortName: string,
  excludeId?: string,
): Promise<void> {
  const clash = await prisma.parameter.findFirst({
    where: {
      shortName: { equals: shortName, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { shortName: true },
  });
  if (clash) {
    throw ApiError.conflict(`Short name "${clash.shortName}" is already used by another parameter`);
  }
}

/** Resolves Test short names to ids, preserving the caller's order.
 *  Throws on any name that is missing, inactive, or ambiguous. */
export async function resolveTestShortNames(shortNames: string[]): Promise<string[]> {
  const names = normalizeShortNames(shortNames);
  if (names.length === 0) return [];

  const rows = await prisma.test.findMany({
    where: { shortName: { in: names, mode: "insensitive" } },
    select: { id: true, shortName: true, status: true },
  });

  const ids: string[] = [];
  for (const name of names) {
    const matches = rows.filter((row) => row.shortName.toLowerCase() === name.toLowerCase());
    if (matches.length === 0) {
      throw ApiError.badRequest(`Test short name "${name}" does not exist`);
    }
    if (matches.length > 1) {
      throw ApiError.badRequest(
        `Test short name "${name}" matches ${matches.length} tests — resolve the duplicate before using it`,
      );
    }
    if (matches[0].status !== "Active") {
      throw ApiError.badRequest(`Test "${name}" is inactive and cannot be added`);
    }
    ids.push(matches[0].id);
  }
  return ids;
}

/** Resolves Test `serialNo` ("S.No") values to ids, preserving the caller's
 *  order — the id-list counterpart of `resolveTestShortNames`, for a Package
 *  CSV's "Test IDs" column: a comma-separated list of Test `S.No` values
 *  (see `Test.serialNo`'s doc-comment), matching how a Test CSV's own
 *  "Parameter IDs" column already cross-references the Parameter sheet.
 *  Throws on any serialNo with no match or that resolves to an inactive Test
 *  — UNLESS `skipMissing` is set, in which case that one entry is silently
 *  dropped instead (recorded into `missingOut`, if given), so the package's
 *  other, resolvable tests still get attached rather than the whole row
 *  failing over one absent test. */
export async function resolveTestSerialNos(
  serialNos: number[],
  options: { skipMissing?: boolean; missingOut?: number[] } = {},
): Promise<string[]> {
  const unique = [...new Set(serialNos)];
  if (unique.length === 0) return [];

  const rows = await prisma.test.findMany({
    where: { serialNo: { in: unique } },
    select: { id: true, serialNo: true, status: true },
  });

  const ids: string[] = [];
  for (const serialNo of serialNos) {
    const match = rows.find((row) => row.serialNo === serialNo);
    if (!match || match.status !== "Active") {
      if (options.skipMissing) {
        options.missingOut?.push(serialNo);
        continue;
      }
      if (!match) throw ApiError.badRequest(`Test S.No ${serialNo} does not exist`);
      throw ApiError.badRequest(`Test S.No ${serialNo} is inactive and cannot be added`);
    }
    ids.push(match.id);
  }
  return ids;
}

/** Resolves Parameter short names to ids, preserving the caller's order.
 *  Throws on any name that is missing, inactive, ambiguous, or — when
 *  `requireDoTest` is set — not independently bookable — UNLESS
 *  `skipMissing` is set, in which case a missing/inactive/not-bookable name
 *  is silently dropped instead (still recorded into `missingOut`, if given)
 *  so the rest of a large CSV row's parameters still get attached rather
 *  than the whole row failing over one absent analyte. An ambiguous name
 *  (matches >1 Parameter) always throws regardless — that's a genuine data
 *  problem to fix, not an absence to shrug off. */
export async function resolveParameterShortNames(
  shortNames: string[],
  options: { requireDoTest?: boolean; skipMissing?: boolean; missingOut?: string[] } = {},
): Promise<string[]> {
  const names = normalizeShortNames(shortNames);
  if (names.length === 0) return [];

  const rows = await prisma.parameter.findMany({
    where: { shortName: { in: names, mode: "insensitive" } },
    select: { id: true, shortName: true, active: true, doTest: true },
  });

  const ids: string[] = [];
  for (const name of names) {
    const matches = rows.filter((row) => row.shortName.toLowerCase() === name.toLowerCase());
    if (matches.length === 0) {
      if (options.skipMissing) {
        options.missingOut?.push(name);
        continue;
      }
      throw ApiError.badRequest(`Parameter short name "${name}" does not exist`);
    }
    if (matches.length > 1) {
      throw ApiError.badRequest(
        `Parameter short name "${name}" matches ${matches.length} parameters — resolve the duplicate before using it`,
      );
    }
    if (!matches[0].active) {
      if (options.skipMissing) {
        options.missingOut?.push(name);
        continue;
      }
      throw ApiError.badRequest(`Parameter "${name}" is inactive and cannot be added`);
    }
    if (options.requireDoTest && !matches[0].doTest) {
      if (options.skipMissing) {
        options.missingOut?.push(name);
        continue;
      }
      throw ApiError.badRequest(
        `Parameter "${name}" is not independently bookable (Do Test is off), so it can't be added to a package directly — add a test that contains it instead`,
      );
    }
    ids.push(matches[0].id);
  }
  return ids;
}

/** Resolves Parameter `serialNo` ("S.No") values to ids, preserving the
 *  caller's order — the id-list counterpart of `resolveParameterShortNames`,
 *  for a Test CSV's "Parameter IDs" column (and a Package CSV's, since a
 *  Package attaches standalone parameters the same way): a comma-separated
 *  list of Parameter `S.No` values (see `Parameter.serialNo`'s doc-comment)
 *  rather than short names, matching how the source spreadsheet a lab hands
 *  over cross-references its own Parameter sheet. Throws on any serialNo with
 *  no match, that resolves to an inactive Parameter, or — when
 *  `requireDoTest` is set — one that isn't independently bookable — UNLESS
 *  `skipMissing` is set, in which case that one entry is silently dropped
 *  instead (recorded into `missingOut`, if given), so the row's other,
 *  resolvable parameters still get attached rather than the whole row
 *  failing. */
export async function resolveParameterSerialNos(
  serialNos: number[],
  options: { requireDoTest?: boolean; skipMissing?: boolean; missingOut?: number[] } = {},
): Promise<string[]> {
  const unique = [...new Set(serialNos)];
  if (unique.length === 0) return [];

  const rows = await prisma.parameter.findMany({
    where: { serialNo: { in: unique } },
    select: { id: true, serialNo: true, active: true, doTest: true },
  });

  const ids: string[] = [];
  for (const serialNo of serialNos) {
    const match = rows.find((row) => row.serialNo === serialNo);
    if (!match || !match.active || (options.requireDoTest && !match.doTest)) {
      if (options.skipMissing) {
        options.missingOut?.push(serialNo);
        continue;
      }
      if (!match) throw ApiError.badRequest(`Parameter S.No ${serialNo} does not exist`);
      if (!match.active) {
        throw ApiError.badRequest(`Parameter S.No ${serialNo} is inactive and cannot be added`);
      }
      throw ApiError.badRequest(
        `Parameter S.No ${serialNo} is not independently bookable (Do Test is off), so it can't be added to a package directly — add a test that contains it instead`,
      );
    }
    ids.push(match.id);
  }
  return ids;
}

/** The id-side counterpart of `resolveTestShortNames` — the admin UI's picker
 *  already knows ids, but they still have to exist and be active. */
export async function assertTestIdsUsable(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const rows = await prisma.test.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, status: true },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  for (const id of ids) {
    const row = byId.get(id);
    if (!row) {
      throw ApiError.badRequest("One or more selected tests do not exist");
    }
    if (row.status !== "Active") {
      throw ApiError.badRequest(`Test "${row.name}" is inactive and cannot be added`);
    }
  }
}

export async function assertParameterIdsUsable(
  ids: string[],
  options: { requireDoTest?: boolean } = {},
): Promise<void> {
  if (ids.length === 0) return;
  const rows = await prisma.parameter.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, active: true, doTest: true },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  for (const id of ids) {
    const row = byId.get(id);
    if (!row) {
      throw ApiError.badRequest("One or more selected parameters do not exist");
    }
    if (!row.active) {
      throw ApiError.badRequest(`Parameter "${row.name}" is inactive and cannot be added`);
    }
    if (options.requireDoTest && !row.doTest) {
      throw ApiError.badRequest(
        `Parameter "${row.name}" is not independently bookable (Do Test is off), so it can't be added to a package directly — add a test that contains it instead`,
      );
    }
  }
}

/** `offerPrice` is a discounted price, so it can never exceed the list price.
 *  Enforced for Parameter, Test, and Package alike from this one place. */
export function assertOfferPriceNotAbovePrice(
  price: number,
  offerPrice: number | null | undefined,
): void {
  if (offerPrice == null) return;
  if (offerPrice > price) {
    throw ApiError.badRequest("Offer price cannot be greater than price");
  }
}

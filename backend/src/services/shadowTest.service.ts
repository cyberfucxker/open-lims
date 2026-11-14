import { prisma } from "../config/database";
import { generateUniqueSlug } from "../utils/slug.util";

const DEFAULT_REPORT_TIME = "24 hrs";

/** Appends "-2", "-3", … until a Test short name is free — the `shortName`
 *  equivalent of `generateUniqueSlug`. Needed because a shadow Test's default
 *  short name (the Parameter's own `shortName`) can collide with an
 *  independently-created, unrelated Test — unlike `generateUniqueSlug` this
 *  runs unattended (no form to surface a "short name taken" error to), so it
 *  self-resolves instead of throwing. */
async function generateUniqueTestShortName(base: string): Promise<string> {
  let candidate = base;
  let suffix = 2;
  while (
    await prisma.test.findFirst({
      where: { shortName: { equals: candidate, mode: "insensitive" } },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

/** Finds (or creates/updates) the single-parameter `Test` that makes
 *  `parameterId` directly bookable through the ordinary Test pipeline —
 *  see `Test.sourceParameterId`'s doc-comment for why this exists instead of
 *  teaching billing/appointments/report-generation a second, Parameter-based
 *  booking path. Call this after every Parameter create/update (including
 *  CSV import — see `parameter.service.ts`) so the shadow Test never drifts
 *  from the analyte it mirrors.
 *
 *  Returns `null` when the parameter isn't actually sellable standalone:
 *  `doTest` off, inactive, or missing the one thing a shadow Test can't fake
 *  — `sampleTypeId` (required on `Test`, optional on `Parameter`). An
 *  existing shadow Test is deactivated rather than deleted in that case, so
 *  a Test that's already been booked/reported against keeps existing for its
 *  own history — same convention as retiring any other Test.
 *
 *  Idempotent and safe to call repeatedly: on every admin save, and from the
 *  one-off `prisma/backfillShadowTests.ts` for parameters that predate this
 *  feature. Errors are the caller's problem — this never swallows one, so a
 *  provisioning failure surfaces instead of silently leaving a Parameter
 *  un-bookable; callers that must not fail the parent save on this wrap the
 *  call themselves. */
export async function ensureShadowTestForParameter(parameterId: string) {
  const parameter = await prisma.parameter.findUnique({ where: { id: parameterId } });
  if (!parameter) return null;

  const existing = await prisma.test.findUnique({ where: { sourceParameterId: parameter.id } });

  if (!parameter.doTest || !parameter.active || !parameter.sampleTypeId) {
    if (existing && existing.status !== "Inactive") {
      await prisma.test.update({ where: { id: existing.id }, data: { status: "Inactive" } });
    }
    return null;
  }

  const scalarData = {
    name: parameter.name,
    sampleTypeId: parameter.sampleTypeId,
    appCategoryId: parameter.appCategoryId,
    price: parameter.price,
    offerPrice: parameter.offerPrice,
    reportTime: parameter.reportTime || DEFAULT_REPORT_TIME,
    status: "Active",
    description: parameter.description,
    isFastingRequired: parameter.isFastingRequired,
    fastingHours: parameter.fastingHours,
    followUpDays: parameter.followUpDays,
    followUpTemplate: parameter.followUpTemplate,
    recommendedFor: parameter.recommendedFor,
    recommendedAge: parameter.recommendedAge,
    sampleReportUrl: parameter.sampleReportUrl,
  } as const;

  if (existing) {
    // The admin edits the Parameter, never this row directly — keep its
    // scalar fields in sync rather than letting them go stale.
    return prisma.test.update({ where: { id: existing.id }, data: scalarData });
  }

  const shortName = await generateUniqueTestShortName(parameter.shortName);
  const slug = await generateUniqueSlug(
    parameter.name,
    async (candidate) =>
      !!(await prisma.test.findUnique({ where: { slug: candidate }, select: { id: true } })),
    "test",
  );

  return prisma.test.create({
    data: {
      ...scalarData,
      shortName,
      slug,
      sourceParameterId: parameter.id,
      parameters: { create: [{ parameterId: parameter.id, sortOrder: 0 }] },
    },
  });
}

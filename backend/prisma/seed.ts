import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password.util";
import { SEED_ROLES } from "../src/constants/roles.constants";
import { CMS_PAGE_SEEDS } from "./seedData/cmsPages";
import { PACKAGE_SEEDS } from "./seedData/packages";
import {
  DEPARTMENT_SEEDS,
  PARAMETER_SEEDS,
  SAMPLE_TYPE_SEEDS,
  TEST_SEEDS,
} from "./seedData/catalogue";

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: SEED_ROLES.ADMIN.name },
    update: { label: SEED_ROLES.ADMIN.label },
    create: SEED_ROLES.ADMIN,
  });

  await prisma.role.upsert({
    where: { name: SEED_ROLES.FRANCHISE.name },
    update: { label: SEED_ROLES.FRANCHISE.label },
    create: SEED_ROLES.FRANCHISE,
  });

  // Initial admin credentials come from the environment. When no password is
  // supplied a random one is generated and printed once — change it after the
  // first login.
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const generatedAdminPassword = process.env.SEED_ADMIN_PASSWORD
    ? null
    : randomBytes(12).toString("base64url");
  const defaultAdminPasswordHash = await hashPassword(
    process.env.SEED_ADMIN_PASSWORD ?? (generatedAdminPassword as string),
  );

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      fullName: "System Administrator",
      passwordHash: defaultAdminPasswordHash,
      roleId: adminRole.id,
    },
  });

  await seedAppMasterData();
  await seedCmsPages();

  // Master data (departments, categories, sample types + their barcode configs)
  // always seeds: it's reference data the Test form can't function without, and
  // it's additive — an existing row is updated in place, never duplicated.
  await seedLabMasterData();

  // The SAMPLE catalogue (parameters, tests, packages) is opt-in, because it is
  // NOT reference data — it's example content, and the lab enters its own via
  // the Superadmin UI. Seeding it unconditionally meant a stray `prisma db seed`
  // silently repopulated a deliberately-cleared catalogue and upserted example
  // rows over real ones matching the same shortName. Enable explicitly with:
  //
  //   SEED_CATALOGUE=true npx prisma db seed
  //
  if (process.env.SEED_CATALOGUE === "true") {
    // Layered bottom-up: each step resolves the previous one by name.
    await seedParameters();
    await seedTests();
    await seedPackages();
    console.log("Sample catalogue seeded (SEED_CATALOGUE=true).");
  } else {
    console.log(
      "Skipped the sample test/parameter/package catalogue. Set SEED_CATALOGUE=true to include it.",
    );
  }

  console.log("Seed complete: ADMIN + FRANCHISE roles, default admin user ready.");
  if (generatedAdminPassword) {
    console.log(
      `Generated admin password for "${adminUsername}": ${generatedAdminPassword} (set SEED_ADMIN_PASSWORD to choose your own)`,
    );
  }
}

/** Departments + their Categories, and Sample Types with a barcode config each.
 *  Matched by name rather than upserted: none of the three carries a unique
 *  constraint on name (they're soft-deletable masters, so duplicates by name are
 *  legal), which means there's no key to upsert on. A soft-deleted match is
 *  revived instead of shadowed by a second copy — same convention as
 *  `seedPackages`.
 *
 *  The barcode config is not optional bookkeeping: without a row per sample
 *  type, collecting a sample for any test of that type fails outright at
 *  `idGenerator.ts#nextSampleNo`. */
async function seedLabMasterData() {
  for (const seed of DEPARTMENT_SEEDS) {
    const existing = await prisma.department.findFirst({ where: { name: seed.name } });
    const department = existing
      ? await prisma.department.update({
          where: { id: existing.id },
          data: { code: seed.code, description: seed.description, active: true, deletedAt: null },
        })
      : await prisma.department.create({
          data: { name: seed.name, code: seed.code, description: seed.description },
        });

    for (const category of seed.categories) {
      const existingCategory = await prisma.category.findFirst({
        where: { name: category.name, departmentId: department.id },
      });
      if (existingCategory) {
        await prisma.category.update({
          where: { id: existingCategory.id },
          data: { code: category.code, active: true, deletedAt: null },
        });
      } else {
        await prisma.category.create({
          data: { name: category.name, code: category.code, departmentId: department.id },
        });
      }
    }
  }

  for (const seed of SAMPLE_TYPE_SEEDS) {
    const existing = await prisma.sampleType.findFirst({ where: { name: seed.name } });
    const sampleType = existing
      ? await prisma.sampleType.update({
          where: { id: existing.id },
          data: { description: seed.description, active: true, deletedAt: null },
        })
      : await prisma.sampleType.create({
          data: { name: seed.name, description: seed.description },
        });

    await prisma.sampleTypeBarcodeConfig.upsert({
      where: { sampleTypeId: sampleType.id },
      update: { prefix: seed.barcodePrefix, active: true },
      create: { sampleTypeId: sampleType.id, prefix: seed.barcodePrefix },
    });
  }
}

/** The reusable analyte list. `shortName` IS unique in the schema, so this one
 *  can be a real upsert — and that uniqueness is what makes short names safe to
 *  use as the join key in `seedTests`/`seedPackages` below.
 *
 *  The booking fields (sample type, CMS category, report time, fasting) are only
 *  set for `doTest: true` analytes — see `ParameterSeed`'s doc-comment for why a
 *  purely-nested analyte correctly leaves them null. A named sample type or
 *  category that doesn't resolve is warned about and left null rather than
 *  failing the run, matching how `seedTests`/`seedPackages` handle a bad
 *  reference. */
async function seedParameters() {
  const [sampleTypes, appCategories] = await Promise.all([
    prisma.sampleType.findMany({ where: { deletedAt: null }, select: { id: true, name: true } }),
    prisma.appCategory.findMany({ select: { id: true, name: true } }),
  ]);
  const sampleTypeIdByName = new Map(sampleTypes.map((s) => [s.name.toLowerCase(), s.id]));
  const appCategoryIdByName = new Map(appCategories.map((c) => [c.name.toLowerCase(), c.id]));

  for (const seed of PARAMETER_SEEDS) {
    let sampleTypeId: string | null = null;
    if (seed.sampleType) {
      sampleTypeId = sampleTypeIdByName.get(seed.sampleType.toLowerCase()) ?? null;
      if (!sampleTypeId) {
        console.warn(`  ! "${seed.name}": no sample type "${seed.sampleType}", left unset.`);
      }
    }

    let appCategoryId: string | null = null;
    if (seed.category) {
      appCategoryId = appCategoryIdByName.get(seed.category.toLowerCase()) ?? null;
      if (!appCategoryId) {
        console.warn(`  ! "${seed.name}": no CMS category "${seed.category}", left unset.`);
      }
    }

    const fields = {
      name: seed.name,
      price: seed.price,
      offerPrice: seed.offerPrice,
      doTest: seed.doTest,
      sampleTypeId,
      appCategoryId,
      reportTime: seed.reportTime ?? null,
      isFastingRequired: seed.isFastingRequired ?? false,
      fastingHours: seed.isFastingRequired ? (seed.fastingHours ?? null) : null,
      active: true,
    };

    await prisma.parameter.upsert({
      where: { shortName: seed.shortName },
      update: fields,
      create: { shortName: seed.shortName, ...fields },
    });
  }
}

/** Tests plus their Parameter attachments. Upsertable on `shortName` like
 *  Parameter. Attachments are rebuilt from the seed's list on every run so
 *  editing `TEST_SEEDS.parameters` takes effect, with array position writing
 *  `sortOrder` — the same rule the admin form follows. */
async function seedTests() {
  for (const seed of TEST_SEEDS) {
    // Only the sample type is mandatory. The internal department/category pair
    // and the CMS category are all optional (see `TestSeed`), so a missing one is
    // warned about and left null rather than skipping the whole test.
    const sampleType = await prisma.sampleType.findFirst({ where: { name: seed.sampleType } });
    if (!sampleType) {
      console.warn(`  ! "${seed.name}": no sample type "${seed.sampleType}", test skipped.`);
      continue;
    }

    const department = seed.department
      ? await prisma.department.findFirst({ where: { name: seed.department } })
      : null;
    if (seed.department && !department) {
      console.warn(`  ! "${seed.name}": no department "${seed.department}", left unset.`);
    }

    const category =
      seed.category && department
        ? await prisma.category.findFirst({
            where: { name: seed.category, departmentId: department.id },
          })
        : null;
    if (seed.category && !category) {
      console.warn(`  ! "${seed.name}": no lab category "${seed.category}", left unset.`);
    }

    const appCategory = seed.appCategory
      ? await prisma.appCategory.findFirst({ where: { name: seed.appCategory } })
      : null;
    if (seed.appCategory && !appCategory) {
      console.warn(`  ! "${seed.name}": no CMS category "${seed.appCategory}", left unset.`);
    }

    const fields = {
      name: seed.name,
      departmentId: department?.id ?? null,
      // A lab category is only meaningful alongside its department.
      categoryId: department && category ? category.id : null,
      appCategoryId: appCategory?.id ?? null,
      sampleTypeId: sampleType.id,
      price: seed.price,
      offerPrice: seed.offerPrice,
      reportTime: seed.reportTime,
      description: seed.description,
      status: "Active",
      isPopular: seed.isPopular,
      bookedCount: seed.bookedCount,
      isFastingRequired: seed.isFastingRequired ?? false,
      fastingHours: seed.isFastingRequired ? (seed.fastingHours ?? null) : null,
      recommendedFor: seed.recommendedFor ?? "BOTH",
      recommendedAge: seed.recommendedAge ?? null,
    };

    const test = await prisma.test.upsert({
      where: { shortName: seed.shortName },
      update: fields,
      create: { shortName: seed.shortName, ...fields },
    });

    const parameters = await prisma.parameter.findMany({
      where: { shortName: { in: seed.parameters } },
      select: { id: true, shortName: true },
    });
    const idByShortName = new Map(parameters.map((p) => [p.shortName, p.id]));
    const missing = seed.parameters.filter((shortName) => !idByShortName.has(shortName));
    if (missing.length > 0) {
      console.warn(`  ! "${seed.name}": no such parameter(s), skipped: ${missing.join(", ")}`);
    }

    // Rebuilt rather than diffed, same as packageTests. Safe here because the
    // seed only ever runs against a catalogue with no entered results yet — the
    // API's own update path diffs instead, precisely so it can't delete a join
    // row a ReportParameterResult still points at.
    await prisma.testParameter.deleteMany({ where: { testId: test.id } });
    await prisma.testParameter.createMany({
      data: seed.parameters
        .map((shortName) => idByShortName.get(shortName))
        .filter((id): id is string => Boolean(id))
        .map((parameterId, index) => ({ testId: test.id, parameterId, sortOrder: index })),
    });
  }
}

/** Patient App package catalogue. Depends on Tests and Parameters already
 *  existing — a package is only its membership mapping plus a price, so there's
 *  nothing to seed before those are in place.
 *
 *  Idempotent, but not via `upsert`: `Package.name` carries only an index, not a
 *  unique constraint, so there's no unique key to upsert on. Matching is done by
 *  name and deliberately includes soft-deleted rows, which are then revived —
 *  that keeps the seed's guarantee ("these packages exist and are live") true on
 *  a re-run instead of silently creating a second copy alongside a deleted one.
 *
 *  Membership is resolved from short names by the same one-or-none rule the API
 *  enforces, and standalone parameters are additionally checked for `doTest` —
 *  a seed that violates either is reported and skipped rather than written. */
async function seedPackages() {
  for (const seed of PACKAGE_SEEDS) {
    const tests = await prisma.test.findMany({
      where: { shortName: { in: seed.tests } },
      select: { id: true, shortName: true },
    });

    const testIdByShortName = new Map(tests.map((test) => [test.shortName, test.id]));
    const missingTests = seed.tests.filter((shortName) => !testIdByShortName.has(shortName));
    if (missingTests.length > 0) {
      console.warn(`  ! "${seed.name}": no such test(s), skipped: ${missingTests.join(", ")}`);
    }

    const parameters = await prisma.parameter.findMany({
      where: { shortName: { in: seed.parameters } },
      select: { id: true, shortName: true, doTest: true },
    });
    const parameterByShortName = new Map(parameters.map((p) => [p.shortName, p]));
    const missingParameters = seed.parameters.filter(
      (shortName) => !parameterByShortName.has(shortName),
    );
    if (missingParameters.length > 0) {
      console.warn(
        `  ! "${seed.name}": no such parameter(s), skipped: ${missingParameters.join(", ")}`,
      );
    }
    const notBookable = seed.parameters.filter(
      (shortName) => parameterByShortName.get(shortName)?.doTest === false,
    );
    if (notBookable.length > 0) {
      console.warn(
        `  ! "${seed.name}": parameter(s) are not independently bookable (doTest off), skipped: ${notBookable.join(", ")}`,
      );
    }

    // Resolve in the seed's own order, not the DB's — the app reads a package's
    // reporting time off its first test, and the seed lists them slowest-first.
    const orderedTestIds = seed.tests
      .map((shortName) => testIdByShortName.get(shortName))
      .filter((id): id is string => Boolean(id));
    const orderedParameterIds = seed.parameters
      .map((shortName) => parameterByShortName.get(shortName))
      .filter((row): row is { id: string; shortName: string; doTest: boolean } => Boolean(row))
      .filter((row) => row.doTest)
      .map((row) => row.id);

    if (orderedTestIds.length === 0 && orderedParameterIds.length === 0) {
      console.warn(`  ! "${seed.name}": no resolvable members, package skipped.`);
      continue;
    }

    // The CMS category and declared specimen are optional — a broad multi-organ
    // panel legitimately has neither. A named one that doesn't resolve is warned
    // about and left null rather than failing the run.
    const appCategory = seed.category
      ? await prisma.appCategory.findFirst({ where: { name: seed.category } })
      : null;
    if (seed.category && !appCategory) {
      console.warn(`  ! "${seed.name}": no CMS category "${seed.category}", left unset.`);
    }

    const sampleType = seed.sampleType
      ? await prisma.sampleType.findFirst({ where: { name: seed.sampleType, deletedAt: null } })
      : null;
    if (seed.sampleType && !sampleType) {
      console.warn(`  ! "${seed.name}": no sample type "${seed.sampleType}", left unset.`);
    }

    const existing = await prisma.package.findFirst({ where: { name: seed.name } });
    const fields = {
      name: seed.name,
      appCategoryId: appCategory?.id ?? null,
      sampleTypeId: sampleType?.id ?? null,
      description: seed.description ?? null,
      reportTime: seed.reportTime ?? null,
      isFastingRequired: seed.isFastingRequired ?? false,
      fastingHours: seed.isFastingRequired ? (seed.fastingHours ?? null) : null,
      recommendedFor: seed.recommendedFor ?? "BOTH",
      recommendedAge: seed.recommendedAge ?? null,
      price: seed.price,
      offerPrice: seed.offerPrice,
      isPopular: seed.isPopular,
      bookedCount: seed.bookedCount,
      active: true,
      deletedAt: null,
    };

    const pkg = existing
      ? await prisma.package.update({ where: { id: existing.id }, data: fields })
      : await prisma.package.create({ data: fields });

    // Rebuild both mappings rather than diffing them, so editing a seed's
    // membership takes effect on the next run.
    await prisma.packageTest.deleteMany({ where: { packageId: pkg.id } });
    await prisma.packageTest.createMany({
      data: orderedTestIds.map((testId) => ({ packageId: pkg.id, testId })),
    });
    await prisma.packageParameter.deleteMany({ where: { packageId: pkg.id } });
    await prisma.packageParameter.createMany({
      data: orderedParameterIds.map((parameterId) => ({ packageId: pkg.id, parameterId })),
    });
  }
}

/** Launch content for the Superadmin CMS module — seeded PUBLISHED so the
 *  public `/api/v1/cms/:appType/:slug` endpoint serves real content from day
 *  one. Idempotent: re-running the seed updates existing pages in place
 *  rather than duplicating them (unique on appType+slug). */
async function seedCmsPages() {
  for (const seed of CMS_PAGE_SEEDS) {
    await prisma.cmsPage.upsert({
      where: { appType_slug: { appType: seed.appType, slug: seed.slug } },
      update: {
        title: seed.title,
        content: seed.content,
        metaTitle: seed.metaTitle,
        metaDescription: seed.metaDescription,
      },
      create: {
        appType: seed.appType,
        slug: seed.slug,
        title: seed.title,
        content: seed.content,
        metaTitle: seed.metaTitle,
        metaDescription: seed.metaDescription,
        status: "PUBLISHED",
      },
    });
  }
}

/** Patient App master data: a starter state/city list (Complete Profile and
 *  Verify OTP need at least one city to be selectable) and the single
 *  `AppConfig` row (App Settings module reads exactly one row). */
async function seedAppMasterData() {
  const statesByName: Record<string, { name: string; code: string; cities: string[] }> = {
    Rajasthan: { name: "Rajasthan", code: "RJ", cities: ["Jaipur", "Jodhpur", "Udaipur"] },
    Delhi: { name: "Delhi", code: "DL", cities: ["New Delhi"] },
    Maharashtra: { name: "Maharashtra", code: "MH", cities: ["Mumbai", "Pune"] },
  };

  for (const state of Object.values(statesByName)) {
    const existingState = await prisma.state.findFirst({ where: { name: state.name } });
    const stateRow =
      existingState ??
      (await prisma.state.create({ data: { name: state.name, code: state.code } }));

    for (const cityName of state.cities) {
      const slug = cityName.toLowerCase().replace(/\s+/g, "-");
      await prisma.city.upsert({
        where: { slug },
        update: {},
        create: { name: cityName, slug, stateId: stateRow.id },
      });
    }
  }

  const existingConfig = await prisma.appConfig.findFirst();
  if (!existingConfig) {
    await prisma.appConfig.create({
      data: {
        minSupportedVersion: "1.0.0",
        latestVersion: "1.0.0",
        forceUpdate: false,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/** One-off: provisions the shadow Test (see `Test.sourceParameterId`'s
 *  doc-comment / `services/shadowTest.service.ts`) for every bookable
 *  Parameter that predates this feature — every `doTest = true`, active
 *  Parameter created before shadow-Test provisioning was wired into
 *  `parameter.service.ts#createParameter/updateParameter`. Safe to re-run:
 *  `ensureShadowTestForParameter` is idempotent (find-or-create keyed on
 *  `Test.sourceParameterId`).
 *
 *  Run with: `npx tsx prisma/backfillShadowTests.ts`
 */
import { prisma } from "../src/config/database";
import { ensureShadowTestForParameter } from "../src/services/shadowTest.service";

async function main() {
  const parameters = await prisma.parameter.findMany({
    where: { doTest: true, active: true },
    select: { id: true, name: true, sampleTypeId: true },
  });

  console.log(`Found ${parameters.length} bookable parameters to backfill.`);

  let created = 0;
  let skippedNoSampleType = 0;
  let failed = 0;

  for (const parameter of parameters) {
    if (!parameter.sampleTypeId) {
      skippedNoSampleType++;
      console.log(`Skipped "${parameter.name}" — no Sample Type set.`);
      continue;
    }
    try {
      await ensureShadowTestForParameter(parameter.id);
      created++;
    } catch (error) {
      failed++;
      console.error(
        `Failed for "${parameter.name}":`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log(
    `Done. ${created} shadow tests ensured, ${skippedNoSampleType} skipped (no Sample Type), ${failed} failed.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

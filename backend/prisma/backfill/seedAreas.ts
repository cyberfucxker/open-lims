/**
 * Seeds `app_areas` — the serviceable localities inside each City.
 *
 * Source data (`prisma/seedData/areas.json`) is derived from India Post's own
 * records, not hand-written: locality names and PIN codes come from the
 * official postal directory (GeoNames' India postal export cross-checked
 * against api.postalpincode.in). Only Head Offices and Sub Post Offices are
 * included — India Post's Branch Offices are village-level and would bury the
 * real localities under thousands of hamlets.
 *
 * The JSON is committed rather than fetched at seed time so the result is
 * deterministic, reviewable in diffs, and does not need network access on a
 * production box.
 *
 * Idempotent: areas are matched on (city, name) — the same pair the database
 * uniquely constrains — so a re-run updates pincodes instead of duplicating.
 * Nothing is deleted; an area an operator added by hand survives a re-run.
 *
 *   npm run seed:areas -- --dry-run
 *   npm run seed:areas
 */
import { PrismaClient } from "@prisma/client";
import AREA_SEEDS from "../seedData/areas.json";

const prisma = new PrismaClient();
const isDryRun = process.argv.includes("--dry-run");

type SeedArea = { name: string; pincodes: string[] };

const PINCODE = /^[1-9][0-9]{5}$/;

async function main() {
  console.log(isDryRun ? "DRY RUN — no writes\n" : "APPLYING\n");

  const seeds = AREA_SEEDS as Record<string, SeedArea[]>;
  const cities = await prisma.city.findMany({ select: { id: true, name: true } });
  const cityIdByName = new Map(cities.map((c) => [c.name, c.id]));

  const unknownCities = Object.keys(seeds).filter((name) => !cityIdByName.has(name));
  if (unknownCities.length) {
    console.log(`Cities in the seed file that do not exist yet (run seed:cities first):`);
    unknownCities.forEach((c) => console.log(`  - ${c}`));
    console.log();
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const [cityName, areas] of Object.entries(seeds)) {
    const cityId = cityIdByName.get(cityName);
    if (!cityId) continue;

    const existing = await prisma.area.findMany({
      where: { cityId },
      select: { id: true, name: true, pincodes: true },
    });
    const byName = new Map(existing.map((a) => [a.name.toLowerCase(), a]));

    for (const area of areas) {
      const pincodes = [...new Set(area.pincodes.filter((p) => PINCODE.test(p)))].sort();
      if (pincodes.length === 0) {
        skipped += 1;
        continue;
      }

      const current = byName.get(area.name.toLowerCase());
      if (!current) {
        if (!isDryRun) {
          await prisma.area.create({ data: { cityId, name: area.name, pincodes, isActive: true } });
        }
        created += 1;
        continue;
      }

      const same =
        current.pincodes.length === pincodes.length &&
        current.pincodes.every((p, i) => p === pincodes[i]);
      if (same) continue;

      if (!isDryRun) {
        await prisma.area.update({ where: { id: current.id }, data: { pincodes } });
      }
      updated += 1;
    }
  }

  console.log(
    `Areas — ${created} ${isDryRun ? "would be created" : "created"}, ` +
      `${updated} pincodes ${isDryRun ? "would be updated" : "updated"}, ` +
      `${skipped} skipped (no valid pincode).`,
  );
}

main()
  .catch((error) => {
    console.error("Area seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Reconciles `app_cities` to a sample service-area list (see `CITIES` below —
 * edit it to match the cities your lab actually serves).
 *
 * Cities in the list are upserted by name. By default nothing is removed; pass
 * `--prune` to also delete cities that are absent from the list. Anything that
 * would break a RESTRICT relation (e.g. a city that still has Areas) is
 * reported and skipped rather than forced.
 *
 *   npm run seed:cities -- --dry-run   # report only
 *   npm run seed:cities                # apply
 *   npm run seed:cities -- --prune     # apply and remove unlisted cities
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const isDryRun = process.argv.includes("--dry-run");
const shouldPrune = process.argv.includes("--prune");

/** State code is the census/ISO-style abbreviation. */
const STATES: Record<string, string> = {
  Bihar: "BR",
  Chandigarh: "CH",
  Chhattisgarh: "CG",
  Jharkhand: "JH",
  "Madhya Pradesh": "MP",
  Punjab: "PB",
  Rajasthan: "RJ",
  "Uttar Pradesh": "UP",
};

const CITIES: { name: string; state: string }[] = [
  { name: "Jaipur", state: "Rajasthan" },
  { name: "Kota", state: "Rajasthan" },
  { name: "Agra", state: "Uttar Pradesh" },
  { name: "Ghaziabad", state: "Uttar Pradesh" },
  { name: "Chandigarh", state: "Chandigarh" },
  { name: "Ludhiana", state: "Punjab" },
  { name: "Patna", state: "Bihar" },
  { name: "Raipur", state: "Chhattisgarh" },
  { name: "Ranchi", state: "Jharkhand" },
  { name: "Gwalior", state: "Madhya Pradesh" },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log(isDryRun ? "DRY RUN — no writes\n" : "APPLYING\n");

  const targetNames = new Set(CITIES.map((c) => c.name));
  const existing = await prisma.city.findMany({
    select: {
      id: true,
      name: true,
      state: { select: { name: true } },
      _count: { select: { areas: true, appUsers: true, phlebotomists: true } },
    },
  });

  // --- Remove cities no longer served ---------------------------------
  const toRemove = shouldPrune ? existing.filter((c) => !targetNames.has(c.name)) : [];
  console.log(`Cities to remove (${toRemove.length}):`);
  for (const city of toRemove) {
    // Areas are ON DELETE RESTRICT — a city with any would abort the whole
    // run. Report and skip so the rest still reconciles.
    if (city._count.areas > 0) {
      console.log(`  SKIP  ${city.name} — has ${city._count.areas} area(s); remove those first`);
      continue;
    }
    console.log(`  ${city.name} (${city.state.name})`);
    if (!isDryRun) await prisma.city.delete({ where: { id: city.id } });
  }
  if (toRemove.length === 0) console.log("  (none)");

  // --- Ensure states ----------------------------------------------------
  const stateIdByName = new Map<string, string>();
  for (const [name, code] of Object.entries(STATES)) {
    let state = await prisma.state.findFirst({ where: { name } });
    if (!state) {
      console.log(`  + state ${name} (${code})`);
      if (isDryRun) continue;
      state = await prisma.state.create({ data: { name, code } });
    }
    stateIdByName.set(name, state.id);
  }

  // --- Upsert cities ----------------------------------------------------
  let created = 0;
  let kept = 0;
  const existingByName = new Map(existing.map((c) => [c.name, c]));

  for (const city of CITIES) {
    const current = existingByName.get(city.name);
    if (current) {
      kept += 1;
      continue;
    }
    if (isDryRun) {
      created += 1;
      continue;
    }
    const stateId = stateIdByName.get(city.state);
    if (!stateId) throw new Error(`no state id for ${city.state}`);
    await prisma.city.create({
      data: { name: city.name, slug: slugify(city.name), stateId, isActive: true },
    });
    created += 1;
  }

  console.log(
    `\nCities: ${created} ${isDryRun ? "would be created" : "created"}, ` +
      `${kept} already present (kept with all their linked data), ` +
      `${toRemove.filter((c) => c._count.areas === 0).length} removed.`,
  );
  console.log(`Target list size: ${CITIES.length}`);
}

main()
  .catch((error) => {
    console.error("City seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

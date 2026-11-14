/**
 * One-time backfill for the clone-on-assign price list model
 * (migration `20260805111500_price_list_ownership_and_polymorphic_items`).
 *
 * Before that migration an Organization pointed straight at a shared PriceList.
 * Afterwards a PriceList is either an admin TEMPLATE (`ownerOrganizationId`
 * NULL) or a private CLONE owned by one organization. Existing organizations
 * are still pointing at templates, so the moment the franchise portal ships
 * they would be editing prices shared with every other organization on the same
 * list — exactly the thing clone-on-assign exists to prevent.
 *
 * This script mints each such organization its own clone (name, items and
 * template provenance copied) and repoints `Organization.priceListId` at it.
 *
 * Idempotent and re-runnable: an organization that already owns a list is
 * skipped, so a partial run can simply be run again.
 *
 *   npm run backfill:price-lists -- --dry-run   # report only, writes nothing
 *   npm run backfill:price-lists                # apply
 *
 * Run the dry run against a production dump before applying for real.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(isDryRun ? "DRY RUN — no writes will be made\n" : "APPLYING changes\n");

  // Organizations pointing at a list they do not own. A list with a non-null
  // `ownerOrganizationId` is already someone's clone, so `priceList.is` filters
  // those out and leaves only the templates that still need cloning.
  const organizations = await prisma.organization.findMany({
    where: {
      priceListId: { not: null },
      priceList: { is: { ownerOrganizationId: null } },
      ownedPriceList: { is: null },
    },
    select: {
      id: true,
      code: true,
      name: true,
      priceListId: true,
      priceList: { select: { id: true, name: true, description: true, active: true } },
    },
    orderBy: { code: "asc" },
  });

  if (organizations.length === 0) {
    console.log("Nothing to do — no organization is pointing at a shared template.");
    return;
  }

  console.log(`${organizations.length} organization(s) need a private clone:\n`);

  let cloned = 0;

  for (const organization of organizations) {
    const template = organization.priceList;
    if (!template) continue;

    const items = await prisma.priceListItem.findMany({
      where: { priceListId: template.id },
      select: { itemType: true, itemId: true, price: true },
    });

    const cloneName = `${template.name} — ${organization.code}`;

    console.log(
      `  ${organization.code}  ${organization.name}\n` +
        `      template: "${template.name}" (${items.length} priced item(s))\n` +
        `      clone:    "${cloneName}"`,
    );

    if (isDryRun) continue;

    // One transaction per organization: a clone that exists but is not pointed
    // at, or pointed at but has no items, would both be worse than not running.
    await prisma.$transaction(async (tx) => {
      const clone = await tx.priceList.create({
        data: {
          name: cloneName,
          description: template.description,
          active: template.active,
          ownerOrganizationId: organization.id,
          templateId: template.id,
        },
        select: { id: true },
      });

      if (items.length > 0) {
        await tx.priceListItem.createMany({
          data: items.map((item) => ({
            priceListId: clone.id,
            itemType: item.itemType,
            itemId: item.itemId,
            price: item.price,
          })),
        });
      }

      await tx.organization.update({
        where: { id: organization.id },
        data: { priceListId: clone.id },
      });

      await tx.organizationAuditLog.create({
        data: {
          organizationId: organization.id,
          action: "PRICE_LIST_CLONED",
          note: `Backfill: minted private price list "${cloneName}" from template "${template.name}"`,
        },
      });
    });

    cloned += 1;
  }

  console.log(
    isDryRun
      ? `\nDry run complete — ${organizations.length} clone(s) would be created.`
      : `\nDone — ${cloned} clone(s) created and assigned.`,
  );
}

main()
  .catch((error) => {
    console.error("Price list clone backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

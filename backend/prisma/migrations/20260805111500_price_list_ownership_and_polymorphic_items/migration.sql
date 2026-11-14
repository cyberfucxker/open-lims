-- Two related reshapes of the price-list tables, needed before a franchise can
-- own and edit its own prices.
--
-- PART A — ownership. A PriceList is now either an admin-authored TEMPLATE
-- (`owner_organization_id` NULL) or a private CLONE owned by exactly one
-- franchise. Assigning a template to a franchise mints a clone rather than
-- linking the template, so franchise A's price edit can never move franchise
-- B's prices. The UNIQUE on `owner_organization_id` makes "two franchises
-- sharing one list" unrepresentable rather than merely discouraged — Postgres
-- allows multiple NULLs, so templates stay unconstrained.
--
-- Every pre-existing price list becomes a template (owner NULL). Organizations
-- that already point at one are NOT repointed here — that is a separate,
-- re-runnable backfill script (`prisma/backfill/clonePriceLists.ts`) so it can
-- be dry-run against a production dump before it writes.
--
-- PART B — polymorphic items. `price_list_items` could only override a Test.
-- It now overrides a Test, a Package or a Parameter via (`item_type`,
-- `item_id`), the same convention `app_cart_items` and `app_order_items`
-- already use. Existing rows are migrated in place to `item_type = 'TEST'`;
-- no row is dropped.
--
-- Dropping `test_id` also drops its FK, so catalogue deletes are no longer
-- guarded by referential integrity. They were already guarded by an explicit
-- count() check in test.repository.ts, which is updated in the same change,
-- and equivalent guards are added for packages and parameters.

-- ---------------------------------------------------------------------------
-- Part A: price list ownership
-- ---------------------------------------------------------------------------

-- AlterTable
ALTER TABLE "price_lists" ADD COLUMN     "owner_organization_id" UUID,
ADD COLUMN     "template_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "price_lists_owner_organization_id_key" ON "price_lists"("owner_organization_id");

-- CreateIndex
CREATE INDEX "price_lists_template_id_idx" ON "price_lists"("template_id");

-- AddForeignKey
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_owner_organization_id_fkey" FOREIGN KEY ("owner_organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Part B: polymorphic price list items
-- ---------------------------------------------------------------------------

-- CreateEnum
CREATE TYPE "PriceListItemType" AS ENUM ('TEST', 'PACKAGE', 'PARAMETER');

-- Add the new columns nullable so existing rows survive the ALTER, backfill
-- them from `test_id`, and only then tighten to NOT NULL.
ALTER TABLE "price_list_items" ADD COLUMN     "item_type" "PriceListItemType",
ADD COLUMN     "item_id" UUID;

UPDATE "price_list_items" SET "item_type" = 'TEST', "item_id" = "test_id";

ALTER TABLE "price_list_items" ALTER COLUMN "item_type" SET NOT NULL,
ALTER COLUMN "item_id" SET NOT NULL;

-- Retire the Test-only shape. The unique index has to go before `test_id`
-- itself, and the replacement unique is created after, so the table is never
-- without a duplicate guard for longer than this statement block.
ALTER TABLE "price_list_items" DROP CONSTRAINT "price_list_items_test_id_fkey";

DROP INDEX "price_list_items_price_list_id_test_id_key";

DROP INDEX "price_list_items_test_id_idx";

DROP INDEX "price_list_items_price_list_id_idx";

ALTER TABLE "price_list_items" DROP COLUMN "test_id";

-- CreateIndex
CREATE UNIQUE INDEX "price_list_items_price_list_id_item_type_item_id_key" ON "price_list_items"("price_list_id", "item_type", "item_id");

-- CreateIndex
CREATE INDEX "price_list_items_price_list_id_item_type_idx" ON "price_list_items"("price_list_id", "item_type");

-- CreateIndex
CREATE INDEX "price_list_items_item_id_idx" ON "price_list_items"("item_id");

-- Adds the fields the Superadmin "Add Franchise" form collects, on top of the
-- existing Organization model.
--
-- 1. `franchise_type` — SINGLE_LAB (default) vs CO_LAB. Deliberately a SECOND
--    enum alongside `organization_type` rather than a replacement: that one
--    says what the center DOES (referral-only vs sample-collecting) and is
--    rendered in three LIMS screens; this one says WHOSE branding goes on the
--    report/invoice. They are orthogonal, and replacing the existing enum would
--    mean migrating live rows plus editing LIMS for no functional gain.
--
-- 2. `lab_name` / `lab_logo_path` — Co-Lab branding overrides, NULL for a
--    SINGLE_LAB franchise (which renders the global report_settings branding).
--
-- 3. `city_id` — the Superadmin form picks a city from a dropdown rather than
--    typing it. The pre-existing free-text `city` column is KEPT and still
--    written with the selected city's name, because LIMS lists and filters on
--    it; this FK is additive, not a replacement.
--
-- Owner Name deliberately gets no column — it reuses `contact_person`, which
-- already carries exactly that semantic.
--
-- Fully additive: every column is nullable or defaulted, so existing rows are
-- valid as-is and no backfill is required.

-- CreateEnum
CREATE TYPE "FranchiseType" AS ENUM ('SINGLE_LAB', 'CO_LAB');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "city_id" UUID,
ADD COLUMN     "franchise_type" "FranchiseType" NOT NULL DEFAULT 'SINGLE_LAB',
ADD COLUMN     "lab_logo_path" TEXT,
ADD COLUMN     "lab_name" VARCHAR(150);

-- CreateIndex
CREATE INDEX "organizations_franchise_type_idx" ON "organizations"("franchise_type");

-- CreateIndex
CREATE INDEX "organizations_city_id_idx" ON "organizations"("city_id");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "app_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

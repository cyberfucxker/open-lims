-- Expands `Parameter` from a bare priced analyte into an item that can be sold
-- standalone: its own specimen type, patient-app category, turnaround, sample
-- collection mode, fasting requirement, clinical recommendation, rich-text
-- description, and an optional sample-report attachment.
--
-- Purely additive. Both new FKs are nullable and every new scalar either has a
-- default or is nullable, so existing rows need no backfill: an analyte that
-- only ever appears nested inside a Test (`do_test = false`) has no independent
-- specimen or category, and this migration doesn't invent one for it.
--
-- The category FK points at `app_categories` (the CMS/merchandising tiles —
-- Thyroid, Liver, Kidney…), NOT the department-scoped `categories` table that
-- `tests` uses. Those are two different taxonomies and are deliberately kept so.

-- CreateEnum
CREATE TYPE "sample_collection_mode" AS ENUM ('HOME', 'LAB', 'BOTH');

-- CreateEnum
CREATE TYPE "recommended_gender" AS ENUM ('MALE', 'FEMALE', 'BOTH');

-- AlterTable
ALTER TABLE "parameters" ADD COLUMN     "app_category_id" UUID,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "fasting_hours" INTEGER,
ADD COLUMN     "is_fasting_required" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recommended_age" VARCHAR(60),
ADD COLUMN     "recommended_for" "recommended_gender" NOT NULL DEFAULT 'BOTH',
ADD COLUMN     "report_time" VARCHAR(50),
ADD COLUMN     "sample_collection" "sample_collection_mode" NOT NULL DEFAULT 'BOTH',
ADD COLUMN     "sample_report_url" TEXT,
ADD COLUMN     "sample_type_id" UUID;

-- CreateIndex
CREATE INDEX "parameters_sample_type_id_idx" ON "parameters"("sample_type_id");

-- CreateIndex
CREATE INDEX "parameters_app_category_id_idx" ON "parameters"("app_category_id");

-- AddForeignKey
ALTER TABLE "parameters" ADD CONSTRAINT "parameters_sample_type_id_fkey" FOREIGN KEY ("sample_type_id") REFERENCES "sample_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parameters" ADD CONSTRAINT "parameters_app_category_id_fkey" FOREIGN KEY ("app_category_id") REFERENCES "app_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

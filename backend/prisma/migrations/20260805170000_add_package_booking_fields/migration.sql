-- Brings `Package` in line with `Test` and `Parameter` as a patient-facing
-- catalogue item: its own CMS category, declared primary specimen, turnaround,
-- fasting requirement, clinical recommendation, rich-text description, and an
-- optional sample-report attachment.
--
-- Purely additive. Both new FKs are nullable and every new scalar either has a
-- default or is nullable, so existing packages need no backfill:
--   * `sample_type_id` is the DECLARED primary specimen for the package card —
--     member tests still carry the specimens that actually drive collection, so a
--     mixed-specimen package legitimately leaves this null.
--   * `report_time` null keeps the pre-existing behaviour of deriving the
--     turnaround from the first-listed member test.

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "app_category_id" UUID,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "fasting_hours" INTEGER,
ADD COLUMN     "is_fasting_required" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recommended_age" VARCHAR(60),
ADD COLUMN     "recommended_for" "recommended_gender" NOT NULL DEFAULT 'BOTH',
ADD COLUMN     "report_time" VARCHAR(50),
ADD COLUMN     "sample_report_url" TEXT,
ADD COLUMN     "sample_type_id" UUID;
-- CreateIndex
CREATE INDEX "packages_app_category_id_idx" ON "packages"("app_category_id");
-- CreateIndex
CREATE INDEX "packages_sample_type_id_idx" ON "packages"("sample_type_id");
-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_app_category_id_fkey" FOREIGN KEY ("app_category_id") REFERENCES "app_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_sample_type_id_fkey" FOREIGN KEY ("sample_type_id") REFERENCES "sample_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Brings `Test` in line with `Parameter` as a patient-facing catalogue item, and
-- adds per-branch availability.
--
-- 1. `app_category_id` — the CMS/merchandising category tile the admin Test form
--    now uses. `department_id` and `category_id` are relaxed to NULLable as a
--    consequence: the form no longer collects them, so a Test created there has
--    neither. They remain settable via CSV import for labs that maintain the
--    internal taxonomy, and the printed report falls back to the CMS category
--    name when a Test has no department (see `report.repository.ts`).
--
-- 2. Fasting / recommended-for / recommended-age / sample-report columns,
--    mirroring `parameters` so a Test and a standalone Parameter present
--    identically in the app.
--
-- 3. `test_branch_users` — which branch logins a Test is offered at. NO rows for a
--    Test means "available at every branch", so existing tests need no backfill.
--
-- Purely additive apart from the two DROP NOT NULLs, which only widen what the
-- columns accept and so can't invalidate an existing row.

-- AlterTable
ALTER TABLE "tests" ADD COLUMN     "app_category_id" UUID,
ADD COLUMN     "fasting_hours" INTEGER,
ADD COLUMN     "is_fasting_required" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recommended_age" VARCHAR(60),
ADD COLUMN     "recommended_for" "recommended_gender" NOT NULL DEFAULT 'BOTH',
ADD COLUMN     "sample_report_url" TEXT,
ALTER COLUMN "department_id" DROP NOT NULL,
ALTER COLUMN "category_id" DROP NOT NULL;
-- CreateTable
CREATE TABLE "test_branch_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "test_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "test_branch_users_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "test_branch_users_test_id_idx" ON "test_branch_users"("test_id");
-- CreateIndex
CREATE INDEX "test_branch_users_user_id_idx" ON "test_branch_users"("user_id");
-- CreateIndex
CREATE UNIQUE INDEX "test_branch_users_test_id_user_id_key" ON "test_branch_users"("test_id", "user_id");
-- CreateIndex
CREATE INDEX "tests_app_category_id_idx" ON "tests"("app_category_id");
-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_app_category_id_fkey" FOREIGN KEY ("app_category_id") REFERENCES "app_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "test_branch_users" ADD CONSTRAINT "test_branch_users_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "test_branch_users" ADD CONSTRAINT "test_branch_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rebuilds the Test / Parameter / Package catalogue.
--
-- The old catalogue is wiped rather than migrated: `tests.short_name` had
-- genuine duplicates (two rows both named "CBC"), `test_parameters` was a
-- Test-owned analyte table with no reusable Parameter behind it, and there was
-- no way to attach a standalone analyte to a Package. Every one of those is a
-- shape change, not a data fix, so the catalogue and the transactional rows
-- that reference it are cleared and reseeded.
--
-- Step 1 below therefore deletes appointment/bill/report/sample/app-order rows
-- as well — not because they're catalogue data, but because they FK into
-- `tests` with ON DELETE RESTRICT and cannot survive its truncation. This was
-- explicitly confirmed before writing this migration. Deliberately NOT touched:
-- departments, categories, sample_types, patients, users, coupons, wallets and
-- the wallet ledger, service centers, slots, CMS. (Wallet ledger rows keep
-- their now-dangling `reference_id` order pointers — the ledger is the
-- patient's money history and is not FK-bound to app_orders.)

-- ---------------------------------------------------------------------------
-- Step 1: clear the catalogue and everything that references it, innermost
-- first. Ordering follows the RESTRICT edges; the CASCADE edges would handle
-- most of these implicitly but are listed explicitly so the intent is auditable.
-- ---------------------------------------------------------------------------

-- Report chain (report_parameter_results RESTRICTs test_parameters;
-- report_test_results RESTRICTs both tests and appointment_tests).
DELETE FROM "report_parameter_results";
DELETE FROM "report_test_result_signatories";
DELETE FROM "report_test_results";
DELETE FROM "report_audit_logs";
DELETE FROM "reports";

-- Sample chain (sample_tests RESTRICTs tests).
DELETE FROM "sample_status_logs";
DELETE FROM "sample_tests";
DELETE FROM "samples";

-- Billing chain hanging off appointments.
DELETE FROM "referral_incentives";
DELETE FROM "invoice_send_logs";
DELETE FROM "payments";
DELETE FROM "bills";

-- Patient App order chain. app_payments / app_coupon_redemptions are ON DELETE
-- SET NULL, so they are removed outright instead of being left orphaned.
DELETE FROM "app_payments";
DELETE FROM "app_coupon_redemptions";
DELETE FROM "app_order_appointments";
DELETE FROM "app_order_items";
DELETE FROM "app_orders";
-- Cart items are a polymorphic (item_type, item_id) reference with no FK, so
-- they would silently dangle rather than error.
DELETE FROM "app_cart_items";

-- Appointments themselves (appointment_tests RESTRICTs tests).
DELETE FROM "appointment_tests";
DELETE FROM "appointments";

-- Catalogue-adjacent per-Test config and price overrides.
DELETE FROM "price_list_items";
DELETE FROM "test_result_configs";
DELETE FROM "test_sample_rules";

-- The catalogue itself.
DELETE FROM "package_tests";
DELETE FROM "test_parameters";
DELETE FROM "packages";
DELETE FROM "tests";

-- ---------------------------------------------------------------------------
-- Step 2: restructure. `test_parameters` becomes a pure Test <-> Parameter
-- join carrying per-Test reporting context (sortOrder, formula, unit,
-- reference range); the analyte's own identity and price move to `parameters`.
-- ---------------------------------------------------------------------------

-- AlterTable
ALTER TABLE "test_parameters" DROP COLUMN "name",
DROP COLUMN "short_code",
ADD COLUMN     "parameter_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "tests" DROP COLUMN "reference_range",
ALTER COLUMN "short_name" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "description" DROP NOT NULL;

-- CreateTable
CREATE TABLE "parameters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "short_name" VARCHAR(30) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "offer_price" DECIMAL(10,2),
    "do_test" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_parameters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "package_id" UUID NOT NULL,
    "parameter_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parameters_short_name_key" ON "parameters"("short_name");

-- CreateIndex
CREATE INDEX "parameters_do_test_idx" ON "parameters"("do_test");

-- CreateIndex
CREATE INDEX "parameters_active_idx" ON "parameters"("active");

-- CreateIndex
CREATE INDEX "package_parameters_package_id_idx" ON "package_parameters"("package_id");

-- CreateIndex
CREATE INDEX "package_parameters_parameter_id_idx" ON "package_parameters"("parameter_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_parameters_package_id_parameter_id_key" ON "package_parameters"("package_id", "parameter_id");

-- CreateIndex
CREATE INDEX "test_parameters_parameter_id_idx" ON "test_parameters"("parameter_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_parameters_test_id_parameter_id_key" ON "test_parameters"("test_id", "parameter_id");

-- CreateIndex
CREATE UNIQUE INDEX "tests_short_name_key" ON "tests"("short_name");

-- AddForeignKey
ALTER TABLE "package_parameters" ADD CONSTRAINT "package_parameters_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_parameters" ADD CONSTRAINT "package_parameters_parameter_id_fkey" FOREIGN KEY ("parameter_id") REFERENCES "parameters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_parameters" ADD CONSTRAINT "test_parameters_parameter_id_fkey" FOREIGN KEY ("parameter_id") REFERENCES "parameters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

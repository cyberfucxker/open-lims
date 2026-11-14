-- CreateEnum
CREATE TYPE "SampleStatus" AS ENUM ('PENDING', 'COLLECTED', 'RECEIVED', 'REJECTED', 'PROCESSING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RECEIVED', 'PROCESSING', 'PARTIAL', 'APPROVED', 'SUBMITTED', 'PRINTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TemperatureRequirement" AS ENUM ('ROOM_TEMPERATURE', 'REFRIGERATED_2_8', 'FROZEN_MINUS20', 'FROZEN_MINUS80');

-- CreateEnum
CREATE TYPE "ResultFlag" AS ENUM ('NORMAL', 'LOW', 'HIGH', 'CRITICAL_LOW', 'CRITICAL_HIGH');

-- CreateEnum
CREATE TYPE "BarcodePosition" AS ENUM ('TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT');

-- CreateTable
CREATE TABLE "containers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20),
    "color" VARCHAR(7),
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "containers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_sample_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "test_id" UUID NOT NULL,
    "container_id" UUID,
    "requires_fasting" BOOLEAN NOT NULL DEFAULT false,
    "fasting_hours" INTEGER,
    "is_stat_allowed" BOOLEAN NOT NULL DEFAULT true,
    "temperature_requirement" "TemperatureRequirement" NOT NULL DEFAULT 'ROOM_TEMPERATURE',
    "min_volume_ml" DECIMAL(6,2),
    "volume_unit" VARCHAR(10) NOT NULL DEFAULT 'mL',
    "preparation_instructions" TEXT,
    "collection_instructions" TEXT,
    "post_collection_instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_sample_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_type_barcode_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sample_type_id" UUID NOT NULL,
    "prefix" VARCHAR(10) NOT NULL,
    "number_length" INTEGER NOT NULL DEFAULT 6,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sample_type_barcode_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_result_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "test_id" UUID NOT NULL,
    "unit" VARCHAR(30),
    "method" VARCHAR(100),
    "critical_low" DECIMAL(10,2),
    "critical_high" DECIMAL(10,2),
    "decimal_precision" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_result_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "samples" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sample_no" VARCHAR(30) NOT NULL,
    "appointment_id" UUID NOT NULL,
    "sample_type_id" UUID NOT NULL,
    "container_id" UUID,
    "status" "SampleStatus" NOT NULL DEFAULT 'PENDING',
    "is_emergency" BOOLEAN NOT NULL DEFAULT false,
    "collected_at" TIMESTAMP(3),
    "collected_by_user_id" UUID,
    "received_at" TIMESTAMP(3),
    "received_by_user_id" UUID,
    "rejected_at" TIMESTAMP(3),
    "rejected_by_user_id" UUID,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "samples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_tests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sample_id" UUID NOT NULL,
    "appointment_test_id" UUID NOT NULL,
    "test_id" UUID NOT NULL,

    CONSTRAINT "sample_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_status_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sample_id" UUID NOT NULL,
    "from_status" "SampleStatus",
    "to_status" "SampleStatus" NOT NULL,
    "performed_by_user_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sample_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_no" VARCHAR(30) NOT NULL,
    "appointment_id" UUID NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "is_emergency" BOOLEAN NOT NULL DEFAULT false,
    "entered_by_user_id" UUID,
    "entered_at" TIMESTAMP(3),
    "approved_by_user_id" UUID,
    "approved_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "print_count" INTEGER NOT NULL DEFAULT 0,
    "last_printed_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_test_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_id" UUID NOT NULL,
    "appointment_test_id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "sample_id" UUID,
    "result_value" TEXT,
    "unit" VARCHAR(30),
    "reference_range" TEXT,
    "method" VARCHAR(100),
    "remarks" TEXT,
    "flag" "ResultFlag" NOT NULL DEFAULT 'NORMAL',
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "entered_by_user_id" UUID,
    "entered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_id" UUID NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "performed_by_user_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_settings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'default',
    "lab_name" VARCHAR(150),
    "header_text" TEXT,
    "footer_text" TEXT,
    "logo_path" TEXT,
    "watermark_text" VARCHAR(100),
    "watermark_enabled" BOOLEAN NOT NULL DEFAULT false,
    "show_qr_code" BOOLEAN NOT NULL DEFAULT true,
    "barcode_position" "BarcodePosition" NOT NULL DEFAULT 'TOP_RIGHT',
    "margin_top" INTEGER NOT NULL DEFAULT 40,
    "margin_right" INTEGER NOT NULL DEFAULT 40,
    "margin_bottom" INTEGER NOT NULL DEFAULT 40,
    "margin_left" INTEGER NOT NULL DEFAULT 40,
    "font_size" INTEGER NOT NULL DEFAULT 9,
    "page_size" VARCHAR(10) NOT NULL DEFAULT 'A4',
    "updated_by_user_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "test_sample_rules_test_id_key" ON "test_sample_rules"("test_id");

-- CreateIndex
CREATE INDEX "test_sample_rules_container_id_idx" ON "test_sample_rules"("container_id");

-- CreateIndex
CREATE UNIQUE INDEX "sample_type_barcode_configs_sample_type_id_key" ON "sample_type_barcode_configs"("sample_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_result_configs_test_id_key" ON "test_result_configs"("test_id");

-- CreateIndex
CREATE UNIQUE INDEX "samples_sample_no_key" ON "samples"("sample_no");

-- CreateIndex
CREATE INDEX "samples_appointment_id_idx" ON "samples"("appointment_id");

-- CreateIndex
CREATE INDEX "samples_sample_type_id_idx" ON "samples"("sample_type_id");

-- CreateIndex
CREATE INDEX "samples_status_idx" ON "samples"("status");

-- CreateIndex
CREATE INDEX "samples_created_at_idx" ON "samples"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "samples_appointment_id_sample_type_id_key" ON "samples"("appointment_id", "sample_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "sample_tests_appointment_test_id_key" ON "sample_tests"("appointment_test_id");

-- CreateIndex
CREATE INDEX "sample_tests_sample_id_idx" ON "sample_tests"("sample_id");

-- CreateIndex
CREATE INDEX "sample_tests_test_id_idx" ON "sample_tests"("test_id");

-- CreateIndex
CREATE INDEX "sample_status_logs_sample_id_idx" ON "sample_status_logs"("sample_id");

-- CreateIndex
CREATE UNIQUE INDEX "reports_report_no_key" ON "reports"("report_no");

-- CreateIndex
CREATE UNIQUE INDEX "reports_appointment_id_key" ON "reports"("appointment_id");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_created_at_idx" ON "reports"("created_at");

-- CreateIndex
CREATE INDEX "reports_is_emergency_idx" ON "reports"("is_emergency");

-- CreateIndex
CREATE UNIQUE INDEX "report_test_results_appointment_test_id_key" ON "report_test_results"("appointment_test_id");

-- CreateIndex
CREATE INDEX "report_test_results_report_id_idx" ON "report_test_results"("report_id");

-- CreateIndex
CREATE INDEX "report_test_results_sample_id_idx" ON "report_test_results"("sample_id");

-- CreateIndex
CREATE INDEX "report_audit_logs_report_id_idx" ON "report_audit_logs"("report_id");

-- AddForeignKey
ALTER TABLE "test_sample_rules" ADD CONSTRAINT "test_sample_rules_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_sample_rules" ADD CONSTRAINT "test_sample_rules_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "containers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_type_barcode_configs" ADD CONSTRAINT "sample_type_barcode_configs_sample_type_id_fkey" FOREIGN KEY ("sample_type_id") REFERENCES "sample_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_result_configs" ADD CONSTRAINT "test_result_configs_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_sample_type_id_fkey" FOREIGN KEY ("sample_type_id") REFERENCES "sample_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "containers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_tests" ADD CONSTRAINT "sample_tests_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "samples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_tests" ADD CONSTRAINT "sample_tests_appointment_test_id_fkey" FOREIGN KEY ("appointment_test_id") REFERENCES "appointment_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_tests" ADD CONSTRAINT "sample_tests_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_status_logs" ADD CONSTRAINT "sample_status_logs_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "samples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_test_results" ADD CONSTRAINT "report_test_results_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_test_results" ADD CONSTRAINT "report_test_results_appointment_test_id_fkey" FOREIGN KEY ("appointment_test_id") REFERENCES "appointment_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_test_results" ADD CONSTRAINT "report_test_results_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_test_results" ADD CONSTRAINT "report_test_results_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "samples"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_audit_logs" ADD CONSTRAINT "report_audit_logs_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Sample No. / Report No. generation (see src/utils/idGenerator.ts), same
-- atomic nextval() pattern as patient_id_seq/appointment_no_seq/bill_no_seq.
-- One shared sequence across all sample types keeps every sample number
-- globally unique even though the prefix differs per sample type.
CREATE SEQUENCE IF NOT EXISTS "sample_no_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "report_no_seq" START 1;

-- Data backfill: every existing Sample Type needs a barcode prefix before
-- samples of that type can be collected. Derive a sensible default (first 3
-- letters of the name, uppercased) so nothing is blocked immediately after
-- this migration — same spirit as the department/category/sample_type
-- backfill in `20260709111923_add_master_management_module`.
INSERT INTO "sample_type_barcode_configs" ("id", "sample_type_id", "prefix", "number_length", "updated_at")
SELECT gen_random_uuid(), st."id",
       COALESCE(NULLIF(UPPER(LEFT(REGEXP_REPLACE(st."name", '[^A-Za-z]', '', 'g'), 3)), ''), 'SMP'),
       6, CURRENT_TIMESTAMP
FROM "sample_types" st
WHERE st."deleted_at" IS NULL;

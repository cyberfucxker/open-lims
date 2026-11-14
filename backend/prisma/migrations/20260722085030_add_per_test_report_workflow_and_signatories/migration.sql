-- CreateEnum
CREATE TYPE "TestReportStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PRINTED');

-- AlterTable
ALTER TABLE "report_settings" ADD COLUMN     "min_signatures_required" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "report_test_results" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by_user_id" UUID,
ADD COLUMN     "printed_at" TIMESTAMP(3),
ADD COLUMN     "reject_reason" TEXT,
ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "status" "TestReportStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submitted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "report_parameter_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_test_result_id" UUID NOT NULL,
    "test_parameter_id" UUID NOT NULL,
    "result_value" TEXT,
    "machine_value" TEXT,
    "flag" "ResultFlag" NOT NULL DEFAULT 'NORMAL',
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_parameter_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signatories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "title" VARCHAR(150),
    "signature_path" TEXT,
    "passkey_hash" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signatories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_test_result_signatories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_test_result_id" UUID NOT NULL,
    "signatory_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_test_result_signatories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_parameter_results_report_test_result_id_idx" ON "report_parameter_results"("report_test_result_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_parameter_results_report_test_result_id_test_paramet_key" ON "report_parameter_results"("report_test_result_id", "test_parameter_id");

-- CreateIndex
CREATE INDEX "report_test_result_signatories_report_test_result_id_idx" ON "report_test_result_signatories"("report_test_result_id");

-- CreateIndex
CREATE INDEX "report_test_result_signatories_signatory_id_idx" ON "report_test_result_signatories"("signatory_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_test_result_signatories_report_test_result_id_signat_key" ON "report_test_result_signatories"("report_test_result_id", "signatory_id");

-- CreateIndex
CREATE INDEX "report_test_results_status_idx" ON "report_test_results"("status");

-- AddForeignKey
ALTER TABLE "report_parameter_results" ADD CONSTRAINT "report_parameter_results_report_test_result_id_fkey" FOREIGN KEY ("report_test_result_id") REFERENCES "report_test_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_parameter_results" ADD CONSTRAINT "report_parameter_results_test_parameter_id_fkey" FOREIGN KEY ("test_parameter_id") REFERENCES "test_parameters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_test_result_signatories" ADD CONSTRAINT "report_test_result_signatories_report_test_result_id_fkey" FOREIGN KEY ("report_test_result_id") REFERENCES "report_test_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_test_result_signatories" ADD CONSTRAINT "report_test_result_signatories_signatory_id_fkey" FOREIGN KEY ("signatory_id") REFERENCES "signatories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

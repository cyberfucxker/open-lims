-- CreateEnum
CREATE TYPE "ReferralType" AS ENUM ('DOCTOR', 'HOSPITAL', 'CLINIC', 'SELF', 'CORPORATE', 'OTHER');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IncentiveStatus" AS ENUM ('PENDING', 'SETTLED', 'CANCELLED');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "referral_source_id" UUID;

-- CreateTable
CREATE TABLE "referral_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referral_code" VARCHAR(20) NOT NULL,
    "referral_type" "ReferralType" NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "organization_id" UUID,
    "mobile" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255),
    "speciality" VARCHAR(100),
    "address" TEXT,
    "city" VARCHAR(100),
    "marketing_staff_id" UUID,
    "assigned_price_list_id" UUID,
    "commission_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_source_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referral_source_id" UUID NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "performed_by_user_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_source_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_price_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referral_source_id" UUID NOT NULL,
    "price_list_id" UUID NOT NULL,
    "assigned_by" UUID,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_price_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_settlements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referral_source_id" UUID NOT NULL,
    "from_date" DATE NOT NULL,
    "to_date" DATE NOT NULL,
    "total_patients" INTEGER NOT NULL,
    "total_revenue" DECIMAL(12,2) NOT NULL,
    "commission_percentage" DECIMAL(5,2) NOT NULL,
    "commission_amount" DECIMAL(12,2) NOT NULL,
    "adjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "final_amount" DECIMAL(12,2) NOT NULL,
    "settlement_status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "payment_date" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_incentives" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referral_source_id" UUID NOT NULL,
    "bill_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "bill_amount" DECIMAL(10,2) NOT NULL,
    "commission_percentage" DECIMAL(5,2) NOT NULL,
    "incentive_amount" DECIMAL(10,2) NOT NULL,
    "incentive_status" "IncentiveStatus" NOT NULL DEFAULT 'PENDING',
    "settlement_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_incentives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_sources_referral_code_key" ON "referral_sources"("referral_code");

-- CreateIndex
CREATE INDEX "referral_sources_status_idx" ON "referral_sources"("status");

-- CreateIndex
CREATE INDEX "referral_sources_name_idx" ON "referral_sources"("name");

-- CreateIndex
CREATE INDEX "referral_sources_marketing_staff_id_idx" ON "referral_sources"("marketing_staff_id");

-- CreateIndex
CREATE INDEX "referral_sources_assigned_price_list_id_idx" ON "referral_sources"("assigned_price_list_id");

-- CreateIndex
CREATE INDEX "referral_source_audit_logs_referral_source_id_idx" ON "referral_source_audit_logs"("referral_source_id");

-- CreateIndex
CREATE INDEX "referral_price_assignments_referral_source_id_idx" ON "referral_price_assignments"("referral_source_id");

-- CreateIndex
CREATE INDEX "referral_settlements_referral_source_id_idx" ON "referral_settlements"("referral_source_id");

-- CreateIndex
CREATE INDEX "referral_settlements_settlement_status_idx" ON "referral_settlements"("settlement_status");

-- CreateIndex
CREATE UNIQUE INDEX "referral_incentives_bill_id_key" ON "referral_incentives"("bill_id");

-- CreateIndex
CREATE INDEX "referral_incentives_referral_source_id_idx" ON "referral_incentives"("referral_source_id");

-- CreateIndex
CREATE INDEX "referral_incentives_incentive_status_idx" ON "referral_incentives"("incentive_status");

-- CreateIndex
CREATE INDEX "referral_incentives_settlement_id_idx" ON "referral_incentives"("settlement_id");

-- CreateIndex
CREATE INDEX "patients_referral_source_id_idx" ON "patients"("referral_source_id");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_referral_source_id_fkey" FOREIGN KEY ("referral_source_id") REFERENCES "referral_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_sources" ADD CONSTRAINT "referral_sources_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_sources" ADD CONSTRAINT "referral_sources_marketing_staff_id_fkey" FOREIGN KEY ("marketing_staff_id") REFERENCES "marketing_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_sources" ADD CONSTRAINT "referral_sources_assigned_price_list_id_fkey" FOREIGN KEY ("assigned_price_list_id") REFERENCES "price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_source_audit_logs" ADD CONSTRAINT "referral_source_audit_logs_referral_source_id_fkey" FOREIGN KEY ("referral_source_id") REFERENCES "referral_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_price_assignments" ADD CONSTRAINT "referral_price_assignments_referral_source_id_fkey" FOREIGN KEY ("referral_source_id") REFERENCES "referral_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_price_assignments" ADD CONSTRAINT "referral_price_assignments_price_list_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "price_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_settlements" ADD CONSTRAINT "referral_settlements_referral_source_id_fkey" FOREIGN KEY ("referral_source_id") REFERENCES "referral_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_incentives" ADD CONSTRAINT "referral_incentives_referral_source_id_fkey" FOREIGN KEY ("referral_source_id") REFERENCES "referral_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_incentives" ADD CONSTRAINT "referral_incentives_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_incentives" ADD CONSTRAINT "referral_incentives_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_incentives" ADD CONSTRAINT "referral_incentives_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "referral_settlements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

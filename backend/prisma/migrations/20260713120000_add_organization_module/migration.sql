-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('GENERAL_CENTER', 'COLLECTION_CENTER');

-- CreateEnum
CREATE TYPE "OrgPaymentType" AS ENUM ('PREPAID', 'POSTPAID');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "organization_id" UUID;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "organization_id" UUID;

-- CreateTable
CREATE TABLE "price_lists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "price_list_id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "contact_person" VARCHAR(150),
    "mobile" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255),
    "country" VARCHAR(100),
    "state" VARCHAR(100),
    "city" VARCHAR(100),
    "pincode" VARCHAR(10),
    "address" TEXT,
    "description" TEXT,
    "price_list_id" UUID,
    "payment_type" "OrgPaymentType" NOT NULL DEFAULT 'PREPAID',
    "credit_limit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "advance_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "due_days" INTEGER NOT NULL DEFAULT 0,
    "source" VARCHAR(150),
    "billing_rules" TEXT,
    "invoice_rules" TEXT,
    "report_delivery_channels" JSONB NOT NULL DEFAULT '[]',
    "bill_delivery_channels" JSONB NOT NULL DEFAULT '[]',
    "login_enabled" BOOLEAN NOT NULL DEFAULT false,
    "enabled_modules" JSONB NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "performed_by_user_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_list_items_price_list_id_idx" ON "price_list_items"("price_list_id");

-- CreateIndex
CREATE INDEX "price_list_items_test_id_idx" ON "price_list_items"("test_id");

-- CreateIndex
CREATE UNIQUE INDEX "price_list_items_price_list_id_test_id_key" ON "price_list_items"("price_list_id", "test_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

-- CreateIndex
CREATE INDEX "organizations_type_idx" ON "organizations"("type");

-- CreateIndex
CREATE INDEX "organizations_active_idx" ON "organizations"("active");

-- CreateIndex
CREATE INDEX "organizations_name_idx" ON "organizations"("name");

-- CreateIndex
CREATE INDEX "organization_audit_logs_organization_id_idx" ON "organization_audit_logs"("organization_id");

-- CreateIndex
CREATE INDEX "patients_organization_id_idx" ON "patients"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_organization_id_key" ON "users"("organization_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_price_list_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "price_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_price_list_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_audit_logs" ADD CONSTRAINT "organization_audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Sequence backing the human-readable, barcode-friendly Organization code
-- ("ORG000123"), same atomic-nextval() pattern as patient_id_seq/bill_no_seq
-- (see src/utils/idGenerator.ts).
CREATE SEQUENCE IF NOT EXISTS "organization_code_seq" START 1;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "referral_doctor_id" UUID;

-- CreateTable
CREATE TABLE "marketing_staff" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255),
    "designation" VARCHAR(100),
    "branch_id" VARCHAR(50),
    "joining_date" DATE NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_staff_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "marketing_staff_id" UUID NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "performed_by_user_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_staff_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_doctors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "doctor_name" VARCHAR(150) NOT NULL,
    "hospital_name" VARCHAR(150),
    "speciality" VARCHAR(100),
    "mobile" VARCHAR(15),
    "email" VARCHAR(255),
    "city" VARCHAR(100),
    "address" TEXT,
    "remarks" TEXT,
    "marketing_staff_id" UUID,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_doctor_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referral_doctor_id" UUID NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "performed_by_user_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_doctor_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_visits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "marketing_staff_id" UUID NOT NULL,
    "referral_doctor_id" UUID NOT NULL,
    "visit_date" DATE NOT NULL,
    "next_visit_date" DATE,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_targets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "marketing_staff_id" UUID NOT NULL,
    "month" SMALLINT NOT NULL,
    "year" SMALLINT NOT NULL,
    "revenue_target" DECIMAL(12,2) NOT NULL,
    "doctor_target" INTEGER NOT NULL,
    "patient_target" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_slabs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "from_amount" DECIMAL(12,2) NOT NULL,
    "to_amount" DECIMAL(12,2),
    "percentage" DECIMAL(5,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_slabs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketing_staff_employee_code_key" ON "marketing_staff"("employee_code");

-- CreateIndex
CREATE INDEX "marketing_staff_status_idx" ON "marketing_staff"("status");

-- CreateIndex
CREATE INDEX "marketing_staff_name_idx" ON "marketing_staff"("name");

-- CreateIndex
CREATE INDEX "marketing_staff_audit_logs_marketing_staff_id_idx" ON "marketing_staff_audit_logs"("marketing_staff_id");

-- CreateIndex
CREATE INDEX "referral_doctors_marketing_staff_id_idx" ON "referral_doctors"("marketing_staff_id");

-- CreateIndex
CREATE INDEX "referral_doctors_doctor_name_idx" ON "referral_doctors"("doctor_name");

-- CreateIndex
CREATE INDEX "referral_doctors_status_idx" ON "referral_doctors"("status");

-- CreateIndex
CREATE INDEX "referral_doctor_audit_logs_referral_doctor_id_idx" ON "referral_doctor_audit_logs"("referral_doctor_id");

-- CreateIndex
CREATE INDEX "doctor_visits_marketing_staff_id_idx" ON "doctor_visits"("marketing_staff_id");

-- CreateIndex
CREATE INDEX "doctor_visits_referral_doctor_id_idx" ON "doctor_visits"("referral_doctor_id");

-- CreateIndex
CREATE INDEX "doctor_visits_next_visit_date_idx" ON "doctor_visits"("next_visit_date");

-- CreateIndex
CREATE INDEX "monthly_targets_month_year_idx" ON "monthly_targets"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_targets_marketing_staff_id_month_year_key" ON "monthly_targets"("marketing_staff_id", "month", "year");

-- CreateIndex
CREATE INDEX "patients_referral_doctor_id_idx" ON "patients"("referral_doctor_id");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_referral_doctor_id_fkey" FOREIGN KEY ("referral_doctor_id") REFERENCES "referral_doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_staff_audit_logs" ADD CONSTRAINT "marketing_staff_audit_logs_marketing_staff_id_fkey" FOREIGN KEY ("marketing_staff_id") REFERENCES "marketing_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_doctors" ADD CONSTRAINT "referral_doctors_marketing_staff_id_fkey" FOREIGN KEY ("marketing_staff_id") REFERENCES "marketing_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_doctor_audit_logs" ADD CONSTRAINT "referral_doctor_audit_logs_referral_doctor_id_fkey" FOREIGN KEY ("referral_doctor_id") REFERENCES "referral_doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_visits" ADD CONSTRAINT "doctor_visits_marketing_staff_id_fkey" FOREIGN KEY ("marketing_staff_id") REFERENCES "marketing_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_visits" ADD CONSTRAINT "doctor_visits_referral_doctor_id_fkey" FOREIGN KEY ("referral_doctor_id") REFERENCES "referral_doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_targets" ADD CONSTRAINT "monthly_targets_marketing_staff_id_fkey" FOREIGN KEY ("marketing_staff_id") REFERENCES "marketing_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('REGISTERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'CARD', 'UPI', 'INSURANCE', 'CREDIT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PARTIAL', 'PENDING');

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" VARCHAR(20) NOT NULL,
    "optional_patient_id" VARCHAR(50),
    "title" VARCHAR(20) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "gender" "Gender" NOT NULL,
    "dob" DATE NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255),
    "organization" VARCHAR(150),
    "referral" VARCHAR(150),
    "whatsapp_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "sms_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "email_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appointment_no" VARCHAR(20) NOT NULL,
    "patient_id" UUID NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REGISTERED',
    "appointment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(10,2) NOT NULL,
    "net_amount" DECIMAL(10,2) NOT NULL,
    "payment_mode" "PaymentMode" NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "due_amount" DECIMAL(10,2) NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_tests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appointment_id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "test_name" VARCHAR(200) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "appointment_tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_patient_id_key" ON "patients"("patient_id");

-- CreateIndex
CREATE INDEX "patients_mobile_idx" ON "patients"("mobile");

-- CreateIndex
CREATE INDEX "patients_optional_patient_id_idx" ON "patients"("optional_patient_id");

-- CreateIndex
CREATE INDEX "patients_organization_idx" ON "patients"("organization");

-- CreateIndex
CREATE INDEX "patients_referral_idx" ON "patients"("referral");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_appointment_no_key" ON "appointments"("appointment_no");

-- CreateIndex
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_appointment_date_idx" ON "appointments"("appointment_date");

-- CreateIndex
CREATE INDEX "appointment_tests_appointment_id_idx" ON "appointment_tests"("appointment_id");

-- CreateIndex
CREATE INDEX "appointment_tests_test_id_idx" ON "appointment_tests"("test_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_tests_appointment_id_test_id_key" ON "appointment_tests"("appointment_id", "test_id");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_tests" ADD CONSTRAINT "appointment_tests_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_tests" ADD CONSTRAINT "appointment_tests_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Sequences backing human-readable, barcode-friendly Patient ID / Appointment
-- No. generation (see src/utils/idGenerator.ts). A DB sequence's nextval()
-- is atomic under concurrent registrations, unlike a count()+1 approach.
CREATE SEQUENCE IF NOT EXISTS "patient_id_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "appointment_no_seq" START 1;

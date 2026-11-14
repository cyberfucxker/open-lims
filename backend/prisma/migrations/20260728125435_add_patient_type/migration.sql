-- CreateEnum
CREATE TYPE "PatientType" AS ENUM ('RETAIL', 'B2B');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "patient_type" "PatientType" NOT NULL DEFAULT 'RETAIL';

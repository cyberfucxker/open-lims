-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AppOrderStatus" ADD VALUE 'ACCEPTED';
ALTER TYPE "AppOrderStatus" ADD VALUE 'STARTED_JOURNEY';
ALTER TYPE "AppOrderStatus" ADD VALUE 'REJECTED';

-- AlterEnum
ALTER TYPE "OtpPurpose" ADD VALUE 'PHLEBO_LOGIN';

-- AlterTable
ALTER TABLE "app_config" ADD COLUMN     "help_faqs" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "help_working_hours" TEXT,
ADD COLUMN     "privacy_policy_content" TEXT,
ADD COLUMN     "support_address" TEXT,
ADD COLUMN     "terms_content" TEXT;

-- AlterTable
ALTER TABLE "app_orders" ADD COLUMN     "cod_collected_at" TIMESTAMP(3),
ADD COLUMN     "phlebo_photo_url" TEXT,
ADD COLUMN     "phlebo_remarks" TEXT,
ADD COLUMN     "pin_verified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "phlebotomists" ADD COLUMN     "address" TEXT,
ADD COLUMN     "dob" DATE,
ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "is_profile_complete" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "phlebotomists_mobile_key" ON "phlebotomists"("mobile");


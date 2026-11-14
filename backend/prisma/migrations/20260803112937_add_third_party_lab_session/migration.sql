-- AlterEnum
ALTER TYPE "OtpPurpose" ADD VALUE 'THIRD_PARTY_LAB_LOGIN';

-- CreateTable
CREATE TABLE "app_third_party_lab_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mobile" VARCHAR(15) NOT NULL,
    "user_fid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_third_party_lab_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_third_party_lab_sessions_mobile_key" ON "app_third_party_lab_sessions"("mobile");

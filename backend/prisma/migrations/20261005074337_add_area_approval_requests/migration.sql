-- CreateEnum
CREATE TYPE "AreaApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "area_approval_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "city_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "pincodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "AreaApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "approved_area_id" UUID,
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "area_approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "area_approval_requests_organization_id_idx" ON "area_approval_requests"("organization_id");

-- CreateIndex
CREATE INDEX "area_approval_requests_city_id_idx" ON "area_approval_requests"("city_id");

-- CreateIndex
CREATE INDEX "area_approval_requests_status_idx" ON "area_approval_requests"("status");

-- AddForeignKey
ALTER TABLE "area_approval_requests" ADD CONSTRAINT "area_approval_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area_approval_requests" ADD CONSTRAINT "area_approval_requests_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "app_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area_approval_requests" ADD CONSTRAINT "area_approval_requests_approved_area_id_fkey" FOREIGN KEY ("approved_area_id") REFERENCES "app_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "organization_service_areas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_service_areas_area_id_idx" ON "organization_service_areas"("area_id");

-- CreateIndex
CREATE INDEX "organization_service_areas_organization_id_idx" ON "organization_service_areas"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_service_areas_organization_id_area_id_key" ON "organization_service_areas"("organization_id", "area_id");

-- AddForeignKey
ALTER TABLE "organization_service_areas" ADD CONSTRAINT "organization_service_areas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_service_areas" ADD CONSTRAINT "organization_service_areas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "app_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "app_orders" ADD COLUMN     "service_center_id" UUID;

-- AlterTable
ALTER TABLE "app_service_centers" ADD COLUMN     "organization_id" UUID;

-- CreateIndex
CREATE INDEX "app_orders_service_center_id_idx" ON "app_orders"("service_center_id");

-- CreateIndex
CREATE INDEX "app_service_centers_organization_id_idx" ON "app_service_centers"("organization_id");

-- AddForeignKey
ALTER TABLE "app_service_centers" ADD CONSTRAINT "app_service_centers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_orders" ADD CONSTRAINT "app_orders_service_center_id_fkey" FOREIGN KEY ("service_center_id") REFERENCES "app_service_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

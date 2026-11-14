-- AlterTable
ALTER TABLE "app_cities" ADD COLUMN     "parent_organization_id" UUID;

-- AlterTable
ALTER TABLE "price_list_items" ADD COLUMN     "is_offered" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "app_cities_parent_organization_id_key" ON "app_cities"("parent_organization_id");

-- AddForeignKey
ALTER TABLE "app_cities" ADD CONSTRAINT "app_cities_parent_organization_id_fkey" FOREIGN KEY ("parent_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "phlebotomists" ADD COLUMN     "created_by_organization_id" UUID;

-- CreateIndex
CREATE INDEX "phlebotomists_created_by_organization_id_idx" ON "phlebotomists"("created_by_organization_id");

-- AddForeignKey
ALTER TABLE "phlebotomists" ADD CONSTRAINT "phlebotomists_created_by_organization_id_fkey" FOREIGN KEY ("created_by_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

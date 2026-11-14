-- AlterTable
ALTER TABLE "app_orders" ADD COLUMN     "phlebo_id" UUID;

-- CreateTable
CREATE TABLE "phlebotomists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "photo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phlebotomists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_orders_phlebo_id_idx" ON "app_orders"("phlebo_id");

-- AddForeignKey
ALTER TABLE "app_orders" ADD CONSTRAINT "app_orders_phlebo_id_fkey" FOREIGN KEY ("phlebo_id") REFERENCES "phlebotomists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

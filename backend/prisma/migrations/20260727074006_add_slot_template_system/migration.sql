-- AlterTable
ALTER TABLE "app_addresses" ADD COLUMN     "area_id" UUID;

-- AlterTable
ALTER TABLE "app_cities" ADD COLUMN     "use_new_slot_system" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "app_orders" ADD COLUMN     "area_id" UUID,
ADD COLUMN     "slot_template_id" UUID;

-- AlterTable
ALTER TABLE "phlebotomists" ADD COLUMN     "city_id" UUID,
ADD COLUMN     "working_hours_end" VARCHAR(5),
ADD COLUMN     "working_hours_start" VARCHAR(5);

-- CreateTable
CREATE TABLE "app_areas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "city_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "pincodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slot_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(100) NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "default_capacity" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slot_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city_slot_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "city_id" UUID NOT NULL,
    "slot_template_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_slot_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slot_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "city_id" UUID NOT NULL,
    "slot_template_id" UUID NOT NULL,
    "block_date" DATE NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slot_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "city_id" UUID NOT NULL,
    "holiday_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "area_slot_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "area_id" UUID NOT NULL,
    "slot_template_id" UUID NOT NULL,
    "block_date" DATE NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "area_slot_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phlebotomist_service_areas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phlebotomist_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phlebotomist_service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_areas_city_id_idx" ON "app_areas"("city_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_areas_city_id_name_key" ON "app_areas"("city_id", "name");

-- CreateIndex
CREATE INDEX "city_slot_templates_city_id_idx" ON "city_slot_templates"("city_id");

-- CreateIndex
CREATE INDEX "city_slot_templates_slot_template_id_idx" ON "city_slot_templates"("slot_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "city_slot_templates_city_id_slot_template_id_key" ON "city_slot_templates"("city_id", "slot_template_id");

-- CreateIndex
CREATE INDEX "slot_blocks_city_id_block_date_idx" ON "slot_blocks"("city_id", "block_date");

-- CreateIndex
CREATE UNIQUE INDEX "slot_blocks_city_id_slot_template_id_block_date_key" ON "slot_blocks"("city_id", "slot_template_id", "block_date");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_city_id_holiday_date_key" ON "holidays"("city_id", "holiday_date");

-- CreateIndex
CREATE INDEX "area_slot_blocks_area_id_block_date_idx" ON "area_slot_blocks"("area_id", "block_date");

-- CreateIndex
CREATE UNIQUE INDEX "area_slot_blocks_area_id_slot_template_id_block_date_key" ON "area_slot_blocks"("area_id", "slot_template_id", "block_date");

-- CreateIndex
CREATE INDEX "phlebotomist_service_areas_area_id_idx" ON "phlebotomist_service_areas"("area_id");

-- CreateIndex
CREATE INDEX "phlebotomist_service_areas_phlebotomist_id_idx" ON "phlebotomist_service_areas"("phlebotomist_id");

-- CreateIndex
CREATE UNIQUE INDEX "phlebotomist_service_areas_phlebotomist_id_area_id_key" ON "phlebotomist_service_areas"("phlebotomist_id", "area_id");

-- CreateIndex
CREATE INDEX "app_addresses_area_id_idx" ON "app_addresses"("area_id");

-- CreateIndex
CREATE INDEX "app_orders_slot_template_id_order_date_status_idx" ON "app_orders"("slot_template_id", "order_date", "status");

-- CreateIndex
CREATE INDEX "app_orders_area_id_order_date_status_idx" ON "app_orders"("area_id", "order_date", "status");

-- CreateIndex
CREATE INDEX "phlebotomists_city_id_idx" ON "phlebotomists"("city_id");

-- AddForeignKey
ALTER TABLE "app_addresses" ADD CONSTRAINT "app_addresses_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "app_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_areas" ADD CONSTRAINT "app_areas_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "app_cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city_slot_templates" ADD CONSTRAINT "city_slot_templates_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "app_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city_slot_templates" ADD CONSTRAINT "city_slot_templates_slot_template_id_fkey" FOREIGN KEY ("slot_template_id") REFERENCES "slot_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_blocks" ADD CONSTRAINT "slot_blocks_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "app_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_blocks" ADD CONSTRAINT "slot_blocks_slot_template_id_fkey" FOREIGN KEY ("slot_template_id") REFERENCES "slot_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "app_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area_slot_blocks" ADD CONSTRAINT "area_slot_blocks_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "app_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area_slot_blocks" ADD CONSTRAINT "area_slot_blocks_slot_template_id_fkey" FOREIGN KEY ("slot_template_id") REFERENCES "slot_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phlebotomist_service_areas" ADD CONSTRAINT "phlebotomist_service_areas_phlebotomist_id_fkey" FOREIGN KEY ("phlebotomist_id") REFERENCES "phlebotomists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phlebotomist_service_areas" ADD CONSTRAINT "phlebotomist_service_areas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "app_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_orders" ADD CONSTRAINT "app_orders_slot_template_id_fkey" FOREIGN KEY ("slot_template_id") REFERENCES "slot_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_orders" ADD CONSTRAINT "app_orders_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "app_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phlebotomists" ADD CONSTRAINT "phlebotomists_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "app_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

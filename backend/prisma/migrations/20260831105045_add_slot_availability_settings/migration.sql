-- CreateTable
CREATE TABLE "slot_availability_settings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'default',
    "check_city_configured" BOOLEAN NOT NULL DEFAULT false,
    "check_holiday" BOOLEAN NOT NULL DEFAULT false,
    "check_area_resolved" BOOLEAN NOT NULL DEFAULT false,
    "check_area_block" BOOLEAN NOT NULL DEFAULT false,
    "check_slot_block" BOOLEAN NOT NULL DEFAULT false,
    "check_phlebotomist_coverage" BOOLEAN NOT NULL DEFAULT false,
    "check_capacity" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slot_availability_settings_pkey" PRIMARY KEY ("id")
);

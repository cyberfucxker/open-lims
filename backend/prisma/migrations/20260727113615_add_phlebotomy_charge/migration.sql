-- AlterTable
ALTER TABLE "app_areas" ADD COLUMN     "phlebotomy_charge" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "app_cities" ADD COLUMN     "phlebotomy_charge" DECIMAL(10,2) NOT NULL DEFAULT 100;

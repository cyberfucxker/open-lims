-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "center_id" UUID,
ADD COLUMN     "home_collection" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "address" TEXT;

-- CreateTable
CREATE TABLE "centers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(20),
    "address" TEXT,
    "city" VARCHAR(100),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointments_center_id_idx" ON "appointments"("center_id");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "PhleboNotificationType" AS ENUM ('NEW_ASSIGNMENT', 'BOOKING_CANCELLED', 'BOOKING_UNASSIGNED');

-- CreateTable
CREATE TABLE "phlebo_notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phlebo_id" UUID NOT NULL,
    "type" "PhleboNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "target_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "phlebo_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "phlebo_notifications_phlebo_id_created_at_idx" ON "phlebo_notifications"("phlebo_id", "created_at");

-- AddForeignKey
ALTER TABLE "phlebo_notifications" ADD CONSTRAINT "phlebo_notifications_phlebo_id_fkey" FOREIGN KEY ("phlebo_id") REFERENCES "phlebotomists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

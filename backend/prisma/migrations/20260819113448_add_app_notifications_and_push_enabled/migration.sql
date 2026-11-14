-- CreateEnum
CREATE TYPE "AppNotificationType" AS ENUM ('ORDER_UPDATE', 'REPORT_READY', 'PROMO', 'PRESCRIPTION_STATUS', 'APPOINTMENT_REMINDER', 'BOOKING_CANCELLED');

-- AlterTable
ALTER TABLE "app_users" ADD COLUMN     "push_enabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "app_notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_user_id" UUID NOT NULL,
    "type" "AppNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "image_url" TEXT,
    "target_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "app_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_notifications_app_user_id_created_at_idx" ON "app_notifications"("app_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "app_notifications" ADD CONSTRAINT "app_notifications_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

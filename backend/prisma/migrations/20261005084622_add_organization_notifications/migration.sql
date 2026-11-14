-- CreateEnum
CREATE TYPE "OrganizationNotificationType" AS ENUM ('NEW_BOOKING');

-- CreateTable
CREATE TABLE "organization_notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "type" "OrganizationNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "target_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "organization_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_notifications_organization_id_created_at_idx" ON "organization_notifications"("organization_id", "created_at");

-- AddForeignKey
ALTER TABLE "organization_notifications" ADD CONSTRAINT "organization_notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

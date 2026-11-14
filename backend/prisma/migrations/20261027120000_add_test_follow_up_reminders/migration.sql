-- Test follow-up ("repeat after N days") reminders — services/whatsapp/followUp.service.ts.
-- Hand-written from `prisma migrate diff` of exactly this change. Purely additive:
-- nullable columns on tests/packages/parameters, one boolean on
-- whatsapp_conversations, and the new follow_up_reminders table.

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('SCHEDULED', 'SENT', 'SKIPPED_REBOOKED', 'SKIPPED', 'FAILED', 'BOOKED');

-- AlterTable
ALTER TABLE "parameters" ADD COLUMN     "follow_up_days" INTEGER,
ADD COLUMN     "follow_up_template" VARCHAR(100);

-- AlterTable
ALTER TABLE "tests" ADD COLUMN     "follow_up_days" INTEGER,
ADD COLUMN     "follow_up_template" VARCHAR(100);

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "follow_up_days" INTEGER,
ADD COLUMN     "follow_up_template" VARCHAR(100);

-- AlterTable
ALTER TABLE "whatsapp_conversations" ADD COLUMN     "reminders_opted_out" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "follow_up_reminders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_user_id" UUID NOT NULL,
    "family_member_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "item_type" "CatalogItemType" NOT NULL,
    "item_id" UUID NOT NULL,
    "item_name" VARCHAR(200) NOT NULL,
    "report_ready_at" TIMESTAMP(3) NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'SCHEDULED',
    "template_name" VARCHAR(100),
    "push_sent" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_status" VARCHAR(30),
    "error" TEXT,
    "sent_at" TIMESTAMP(3),
    "booked_order_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follow_up_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "follow_up_reminders_status_due_date_idx" ON "follow_up_reminders"("status", "due_date");

-- CreateIndex
CREATE INDEX "follow_up_reminders_app_user_id_idx" ON "follow_up_reminders"("app_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "follow_up_reminders_order_id_family_member_id_item_type_ite_key" ON "follow_up_reminders"("order_id", "family_member_id", "item_type", "item_id");

-- AddForeignKey
ALTER TABLE "follow_up_reminders" ADD CONSTRAINT "follow_up_reminders_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_reminders" ADD CONSTRAINT "follow_up_reminders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "app_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;


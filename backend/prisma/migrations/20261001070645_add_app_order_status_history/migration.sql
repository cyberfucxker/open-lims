-- CreateEnum
CREATE TYPE "AppOrderStatusChangeSource" AS ENUM ('ADMIN', 'PHLEBO');

-- CreateTable
CREATE TABLE "app_order_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "status" "AppOrderStatus" NOT NULL,
    "source" "AppOrderStatusChangeSource" NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_order_status_history_order_id_idx" ON "app_order_status_history"("order_id");

-- AddForeignKey
ALTER TABLE "app_order_status_history" ADD CONSTRAINT "app_order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "app_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

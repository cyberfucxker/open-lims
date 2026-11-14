-- CreateTable
CREATE TABLE "app_order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "family_member_id" UUID NOT NULL,
    "item_type" "CatalogItemType" NOT NULL,
    "item_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_order_items_order_id_idx" ON "app_order_items"("order_id");

-- AddForeignKey
ALTER TABLE "app_order_items" ADD CONSTRAINT "app_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "app_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_order_items" ADD CONSTRAINT "app_order_items_family_member_id_fkey" FOREIGN KEY ("family_member_id") REFERENCES "app_family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

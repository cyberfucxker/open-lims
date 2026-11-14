-- CreateTable
CREATE TABLE "web_banners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "badge" VARCHAR(40),
    "title" VARCHAR(120) NOT NULL,
    "subtitle" VARCHAR(200),
    "image_url" TEXT NOT NULL,
    "package_id" UUID,
    "link_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "web_banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "web_banners_is_active_sort_order_idx" ON "web_banners"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "web_banners_package_id_idx" ON "web_banners"("package_id");

-- AddForeignKey
ALTER TABLE "web_banners" ADD CONSTRAINT "web_banners_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ad landing pages (/offer/<slug>). Hand-written from `prisma migrate diff`
-- of exactly this change; purely additive (two new tables).

-- CreateTable
CREATE TABLE "landing_pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "city_id" UUID NOT NULL,
    "desktop_banner_url" TEXT,
    "mobile_banner_url" TEXT,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_page_packages" (
    "landing_page_id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "landing_page_packages_pkey" PRIMARY KEY ("landing_page_id","package_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landing_pages_slug_key" ON "landing_pages"("slug");

-- CreateIndex
CREATE INDEX "landing_pages_city_id_idx" ON "landing_pages"("city_id");

-- CreateIndex
CREATE INDEX "landing_page_packages_package_id_idx" ON "landing_page_packages"("package_id");

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "app_cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_page_packages" ADD CONSTRAINT "landing_page_packages_landing_page_id_fkey" FOREIGN KEY ("landing_page_id") REFERENCES "landing_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_page_packages" ADD CONSTRAINT "landing_page_packages_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;


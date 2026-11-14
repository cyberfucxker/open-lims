-- CreateEnum
CREATE TYPE "CmsAppType" AS ENUM ('USER', 'PHLEBO');

-- CreateEnum
CREATE TYPE "CmsPageStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "cms_pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_type" "CmsAppType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "content" TEXT NOT NULL,
    "meta_title" VARCHAR(200),
    "meta_description" VARCHAR(300),
    "status" "CmsPageStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_user_id" UUID,
    "updated_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cms_pages_app_type_status_idx" ON "cms_pages"("app_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cms_pages_app_type_slug_key" ON "cms_pages"("app_type", "slug");

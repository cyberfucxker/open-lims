-- Home page SEO features: a curated "major city" flag, a structured FAQ
-- list, and a singleton editable intro-content block.

ALTER TABLE "app_cities" ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "home_faqs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question" VARCHAR(300) NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_faqs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "home_seo_content" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'default',
    "heading" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_seo_content_pkey" PRIMARY KEY ("id")
);

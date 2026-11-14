-- Home and city mastheads are separate lists now. Every existing row was
-- written for the city-style card (copy + promoted package), so CITY is both
-- the column default and what they all become.
CREATE TYPE "WebBannerPlacement" AS ENUM ('HOME', 'CITY');

ALTER TABLE "web_banners"
  ADD COLUMN "placement" "WebBannerPlacement" NOT NULL DEFAULT 'CITY';

-- A HOME banner is artwork only, so its headline is optional.
ALTER TABLE "web_banners" ALTER COLUMN "title" DROP NOT NULL;

DROP INDEX IF EXISTS "web_banners_is_active_sort_order_idx";
CREATE INDEX "web_banners_placement_is_active_sort_order_idx"
  ON "web_banners" ("placement", "is_active", "sort_order");

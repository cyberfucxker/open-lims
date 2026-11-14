-- CreateEnum
CREATE TYPE "WatermarkMode" AS ENUM ('NONE', 'TEXT', 'IMAGE');

-- Backfill: derive the new single watermark_mode from the old enabled flag
-- before it's dropped, so an existing customized row keeps its watermark
-- behavior (TEXT was the only mode the old boolean ever implied).
ALTER TABLE "report_settings" ADD COLUMN "watermark_mode" "WatermarkMode" NOT NULL DEFAULT 'NONE';
UPDATE "report_settings" SET "watermark_mode" = 'TEXT' WHERE "watermark_enabled" = true;

-- AlterTable
ALTER TABLE "report_settings" DROP COLUMN "watermark_enabled",
ADD COLUMN     "footer_image_path" TEXT,
ADD COLUMN     "header_image_path" TEXT,
ADD COLUMN     "line_spacing" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "patient_fields" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "primary_color" VARCHAR(7) NOT NULL DEFAULT '#0B1E39',
ADD COLUMN     "report_fields" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "show_barcode" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_footer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_page_number" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_signature" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "signature_path" TEXT,
ADD COLUMN     "watermark_image_path" TEXT;

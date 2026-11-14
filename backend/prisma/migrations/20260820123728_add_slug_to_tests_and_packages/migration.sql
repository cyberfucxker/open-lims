-- Add `slug` to "tests" and "packages": nullable + backfilled from the
-- existing `name` column (slugified, deduped by row age for any name
-- collisions), then locked to NOT NULL + UNIQUE. Written by hand (not
-- `prisma migrate dev`, which refuses a required-column-without-default on a
-- non-empty table) specifically so this backfill is safe against however
-- many rows a real environment already has, not just the couple in dev.

-- tests --------------------------------------------------------------------

ALTER TABLE "tests" ADD COLUMN "slug" VARCHAR(220);

WITH slugged AS (
  SELECT
    id,
    NULLIF(
      regexp_replace(
        regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'),
        '(^-+|-+$)', '', 'g'
      ),
      ''
    ) AS base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY regexp_replace(
        regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'),
        '(^-+|-+$)', '', 'g'
      )
      ORDER BY created_at, id
    ) AS rn
  FROM "tests"
)
UPDATE "tests" t
SET "slug" = CASE
  WHEN s.rn = 1 THEN COALESCE(s.base_slug, 'test-' || substring(t.id::text, 1, 8))
  ELSE COALESCE(s.base_slug, 'test-' || substring(t.id::text, 1, 8)) || '-' || s.rn
END
FROM slugged s
WHERE t.id = s.id;

ALTER TABLE "tests" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "tests_slug_key" ON "tests"("slug");

-- packages -------------------------------------------------------------------

ALTER TABLE "packages" ADD COLUMN "slug" VARCHAR(220);

WITH slugged AS (
  SELECT
    id,
    NULLIF(
      regexp_replace(
        regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'),
        '(^-+|-+$)', '', 'g'
      ),
      ''
    ) AS base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY regexp_replace(
        regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'),
        '(^-+|-+$)', '', 'g'
      )
      ORDER BY created_at, id
    ) AS rn
  FROM "packages"
)
UPDATE "packages" p
SET "slug" = CASE
  WHEN s.rn = 1 THEN COALESCE(s.base_slug, 'package-' || substring(p.id::text, 1, 8))
  ELSE COALESCE(s.base_slug, 'package-' || substring(p.id::text, 1, 8)) || '-' || s.rn
END
FROM slugged s
WHERE p.id = s.id;

ALTER TABLE "packages" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "packages_slug_key" ON "packages"("slug");

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20),
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "department_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20),
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sample_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_department_id_idx" ON "categories"("department_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Partial unique indexes: a soft-deleted row's name must not block re-creating
-- an active row with the same name.
CREATE UNIQUE INDEX "departments_name_active_key" ON "departments"("name") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "categories_department_id_name_active_key" ON "categories"("department_id", "name") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "sample_types_name_active_key" ON "sample_types"("name") WHERE "deleted_at" IS NULL;

-- Data backfill: derive master rows from whatever distinct department /
-- category / sample_type strings already exist on `tests`, so this migration
-- is safe to run against a populated table, not just an empty dev database.
INSERT INTO "departments" ("id", "name", "updated_at")
SELECT gen_random_uuid(), d."department", CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "department" FROM "tests") AS d;

INSERT INTO "categories" ("id", "department_id", "name", "updated_at")
SELECT gen_random_uuid(), dep."id", c."category", CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "department", "category" FROM "tests") AS c
JOIN "departments" dep ON dep."name" = c."department";

INSERT INTO "sample_types" ("id", "name", "updated_at")
SELECT gen_random_uuid(), s."sample_type", CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "sample_type" FROM "tests") AS s;

-- AlterTable: add nullable FK columns, backfill by joining on the old
-- free-text columns, then tighten to NOT NULL.
ALTER TABLE "tests" ADD COLUMN "department_id" UUID;
ALTER TABLE "tests" ADD COLUMN "category_id" UUID;
ALTER TABLE "tests" ADD COLUMN "sample_type_id" UUID;

UPDATE "tests" t SET "department_id" = dep."id"
FROM "departments" dep WHERE dep."name" = t."department";

UPDATE "tests" t SET "category_id" = cat."id"
FROM "categories" cat WHERE cat."name" = t."category" AND cat."department_id" = t."department_id";

UPDATE "tests" t SET "sample_type_id" = st."id"
FROM "sample_types" st WHERE st."name" = t."sample_type";

ALTER TABLE "tests" ALTER COLUMN "department_id" SET NOT NULL;
ALTER TABLE "tests" ALTER COLUMN "category_id" SET NOT NULL;
ALTER TABLE "tests" ALTER COLUMN "sample_type_id" SET NOT NULL;

-- DropIndex
DROP INDEX "tests_category_idx";
DROP INDEX "tests_department_idx";

-- AlterTable: drop the now-superseded free-text columns.
ALTER TABLE "tests" DROP COLUMN "category";
ALTER TABLE "tests" DROP COLUMN "department";
ALTER TABLE "tests" DROP COLUMN "sample_type";

-- CreateIndex
CREATE INDEX "tests_department_id_idx" ON "tests"("department_id");
CREATE INDEX "tests_category_id_idx" ON "tests"("category_id");
CREATE INDEX "tests_sample_type_id_idx" ON "tests"("sample_type_id");

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tests" ADD CONSTRAINT "tests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tests" ADD CONSTRAINT "tests_sample_type_id_fkey" FOREIGN KEY ("sample_type_id") REFERENCES "sample_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

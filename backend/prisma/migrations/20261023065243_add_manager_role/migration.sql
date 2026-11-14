-- AlterTable
ALTER TABLE "users" ADD COLUMN     "staff_modules" JSONB NOT NULL DEFAULT '[]';

-- The MANAGER staff role: superadmin access limited to the modules listed in
-- users.staff_modules.
INSERT INTO "roles" ("id", "name", "label", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'MANAGER', 'Manager', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

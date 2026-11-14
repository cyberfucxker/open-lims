-- Admin-set manual list order for the Superadmin Packages screen.
ALTER TABLE "packages" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- Sequential "S.No" — a real DB sequence via SERIAL, so every existing row
-- gets a unique, gap-free number in creation order and every future insert
-- keeps counting up automatically.
ALTER TABLE "packages" ADD COLUMN "serial_no" SERIAL;
ALTER TABLE "packages" ADD CONSTRAINT "packages_serial_no_key" UNIQUE ("serial_no");

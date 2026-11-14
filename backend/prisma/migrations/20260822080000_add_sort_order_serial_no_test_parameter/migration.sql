-- Same Sort_Order / S.No pair added to packages in the previous migration,
-- now for tests and parameters too.

-- Tests
ALTER TABLE "tests" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tests" ADD COLUMN "serial_no" SERIAL;
ALTER TABLE "tests" ADD CONSTRAINT "tests_serial_no_key" UNIQUE ("serial_no");

-- Parameters
ALTER TABLE "parameters" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "parameters" ADD COLUMN "serial_no" SERIAL;
ALTER TABLE "parameters" ADD CONSTRAINT "parameters_serial_no_key" UNIQUE ("serial_no");

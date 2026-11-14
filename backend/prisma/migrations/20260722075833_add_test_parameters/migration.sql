-- CreateTable
CREATE TABLE "test_parameters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "test_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "short_code" VARCHAR(30),
    "unit" VARCHAR(30),
    "reference_range_text" TEXT,
    "reference_range_low" DECIMAL(12,4),
    "reference_range_high" DECIMAL(12,4),
    "formula" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_parameters_test_id_idx" ON "test_parameters"("test_id");

-- AddForeignKey
ALTER TABLE "test_parameters" ADD CONSTRAINT "test_parameters_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "tests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "short_name" VARCHAR(20) NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "sample_type" VARCHAR(50) NOT NULL,
    "report_time" VARCHAR(50) NOT NULL,
    "reference_range" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Active',
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tests_category_idx" ON "tests"("category");

-- CreateIndex
CREATE INDEX "tests_department_idx" ON "tests"("department");

-- CreateIndex
CREATE INDEX "tests_status_idx" ON "tests"("status");

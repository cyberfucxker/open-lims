-- CreateTable
CREATE TABLE "packages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_tests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "package_id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "packages_name_idx" ON "packages"("name");

-- CreateIndex
CREATE INDEX "package_tests_package_id_idx" ON "package_tests"("package_id");

-- CreateIndex
CREATE INDEX "package_tests_test_id_idx" ON "package_tests"("test_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_tests_package_id_test_id_key" ON "package_tests"("package_id", "test_id");

-- AddForeignKey
ALTER TABLE "package_tests" ADD CONSTRAINT "package_tests_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_tests" ADD CONSTRAINT "package_tests_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

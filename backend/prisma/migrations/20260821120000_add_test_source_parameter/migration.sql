-- AlterTable: link a Test to the bookable Parameter it was auto-provisioned
-- from (see Test.sourceParameterId's doc-comment in schema.prisma).
ALTER TABLE "public"."tests" ADD COLUMN "source_parameter_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "tests_source_parameter_id_key" ON "public"."tests"("source_parameter_id");

-- AddForeignKey
ALTER TABLE "public"."tests" ADD CONSTRAINT "tests_source_parameter_id_fkey"
  FOREIGN KEY ("source_parameter_id") REFERENCES "public"."parameters"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

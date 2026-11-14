-- AlterTable: curated "actually order this a lot" flag — see
-- Parameter.isCommonlyUsed's doc-comment in schema.prisma.
ALTER TABLE "public"."parameters" ADD COLUMN "is_commonly_used" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "parameters_is_commonly_used_idx" ON "public"."parameters"("is_commonly_used");

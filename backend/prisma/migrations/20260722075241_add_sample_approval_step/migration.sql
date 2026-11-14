-- AlterEnum
ALTER TYPE "SampleStatus" ADD VALUE 'APPROVED';

-- AlterTable
ALTER TABLE "samples" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by_user_id" UUID;

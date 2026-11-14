-- AlterEnum
ALTER TYPE "PaymentPurpose" ADD VALUE 'THIRD_PARTY_LAB_BALANCE';

-- AlterTable
ALTER TABLE "app_payments" ADD COLUMN     "third_party_amount_before" DECIMAL(10,2),
ADD COLUMN     "third_party_test_regn_id" INTEGER,
ADD COLUMN     "third_party_user_fid" TEXT;

-- CreateIndex
CREATE INDEX "app_payments_third_party_test_regn_id_idx" ON "app_payments"("third_party_test_regn_id");

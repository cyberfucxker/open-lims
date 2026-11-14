-- AlterEnum
ALTER TYPE "WalletTransactionSource" ADD VALUE 'MANUAL_ADJUSTMENT';

-- AlterTable
ALTER TABLE "app_wallet_transactions" ADD COLUMN     "note" TEXT,
ADD COLUMN     "performed_by_user_id" UUID;

/*
  Warnings:

  - You are about to drop the column `paid_amount` on the `appointments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "paid_amount",
ADD COLUMN     "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0;

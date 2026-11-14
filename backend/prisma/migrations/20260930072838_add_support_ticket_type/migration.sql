-- CreateEnum
CREATE TYPE "SupportTicketType" AS ENUM ('COMPLAINT', 'FEEDBACK');

-- AlterTable
ALTER TABLE "app_support_tickets" ADD COLUMN     "type" "SupportTicketType";

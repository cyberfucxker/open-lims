-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SendChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "SendStatus" AS ENUM ('SENT', 'FAILED');

-- AlterEnum
ALTER TYPE "PaymentMode" ADD VALUE 'ONLINE';

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "is_emergency" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "bills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bill_no" VARCHAR(20) NOT NULL,
    "appointment_id" UUID NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'ACTIVE',
    "additional_charges" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(10,2) NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "due_amount" DECIMAL(10,2) NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL,
    "print_count" INTEGER NOT NULL DEFAULT 0,
    "last_printed_at" TIMESTAMP(3),
    "created_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bill_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "mode" "PaymentMode" NOT NULL,
    "transaction_id" VARCHAR(100),
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_send_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bill_id" UUID NOT NULL,
    "channel" "SendChannel" NOT NULL,
    "recipient" VARCHAR(255) NOT NULL,
    "status" "SendStatus" NOT NULL,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_send_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bills_bill_no_key" ON "bills"("bill_no");

-- CreateIndex
CREATE UNIQUE INDEX "bills_appointment_id_key" ON "bills"("appointment_id");

-- CreateIndex
CREATE INDEX "bills_status_idx" ON "bills"("status");

-- CreateIndex
CREATE INDEX "bills_payment_status_idx" ON "bills"("payment_status");

-- CreateIndex
CREATE INDEX "bills_created_at_idx" ON "bills"("created_at");

-- CreateIndex
CREATE INDEX "payments_bill_id_idx" ON "payments"("bill_id");

-- CreateIndex
CREATE INDEX "invoice_send_logs_bill_id_idx" ON "invoice_send_logs"("bill_id");

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_send_logs" ADD CONSTRAINT "invoice_send_logs_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

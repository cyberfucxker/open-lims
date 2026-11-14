-- CreateEnum
CREATE TYPE "SmsLogStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "sms_templates" (
    "key" VARCHAR(60) NOT NULL,
    "dlt_template_id" VARCHAR(30) NOT NULL,
    "body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_templates_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "sms_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_key" VARCHAR(60) NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SmsLogStatus" NOT NULL,
    "response" TEXT,
    "order_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sms_logs_order_id_idx" ON "sms_logs"("order_id");

-- CreateIndex
CREATE INDEX "sms_logs_created_at_idx" ON "sms_logs"("created_at");

-- Seed: sample SMS templates. Replace the placeholder DLT template ids with the ids from your own DLT registration;
-- the body text must match the registration 1:1.
INSERT INTO "sms_templates" ("key", "dlt_template_id", "body", "updated_at") VALUES
('Test_Booking_Confirmation', 'DLT_TEMPLATE_ID_1', 'Dear {name}, your test booking for {test} has been confirmed. Booking ID: {orderId}. Collection Agent will contact you shortly. Regards! Example Diagnostics Lab.', CURRENT_TIMESTAMP),
('Sample_Boy_Assigned', 'DLT_TEMPLATE_ID_2', 'Dear {name}, your collection agent {boy}, Phone: {phone}, has been assigned to collect your sample. Expected pickup time: {time}. Regards! Example Diagnostics Lab.', CURRENT_TIMESTAMP),
('Sample_Accepted', 'DLT_TEMPLATE_ID_3', 'Dear {name}, your sample for {test} has been accepted and is being processed. We will notify you when the report is ready. Regards! Example Diagnostics Lab.', CURRENT_TIMESTAMP),
('Sample_Rejected', 'DLT_TEMPLATE_ID_4', 'Dear {name}, your sample for {test} has been rejected. Please contact us at +91 9876543210 for further assistance. Regards! Example Diagnostics Lab.', CURRENT_TIMESTAMP),
('Report_Download', 'DLT_TEMPLATE_ID_5', 'Dear {name}, your test report for {test} is ready. Download it now from App. Regards! Example Diagnostics Lab.', CURRENT_TIMESTAMP),
('Order_Received', 'DLT_TEMPLATE_ID_6', 'New order received. Order ID: {orderId}, Test: {test}, Customer: {name}. Please check the portal for further details. Example Diagnostics Lab', CURRENT_TIMESTAMP),
('Order_Assigned', 'DLT_TEMPLATE_ID_7', 'New order assigned. Order ID: {orderId}, Customer: {name}, Address: {address}. Please collect the sample as per the instructions. Example Diagnostics Lab.', CURRENT_TIMESTAMP),
('Order_Received_Admin', 'DLT_TEMPLATE_ID_8', 'New order received. Order ID: {orderId}, Test: {test}, Customer: {name} for Center {center}. Please check the portal for further details. Example Diagnostics Lab', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- CreateTable
CREATE TABLE "payment_gateway_config" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'default',
    "razorpay_key_id" TEXT,
    "razorpay_key_secret" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_gateway_config_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN');

-- CreateEnum
CREATE TYPE "FamilyMemberRelation" AS ENUM ('SELF', 'FATHER', 'MOTHER', 'SPOUSE', 'SON', 'DAUGHTER', 'BROTHER', 'SISTER', 'OTHER');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('HOME', 'WORK', 'OTHER');

-- CreateEnum
CREATE TYPE "CouponDiscountType" AS ENUM ('FLAT', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "CatalogItemType" AS ENUM ('TEST', 'PACKAGE');

-- CreateEnum
CREATE TYPE "AppOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REACHED', 'SAMPLE_COLLECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppPaymentMode" AS ENUM ('CASH', 'ONLINE');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('ORDER_PAYMENT', 'WALLET_RECHARGE');

-- CreateEnum
CREATE TYPE "PaymentGatewayStatus" AS ENUM ('INITIATED', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "WalletTransactionSource" AS ENUM ('RECHARGE', 'ORDER_PAYMENT', 'REFUND', 'BONUS');

-- CreateEnum
CREATE TYPE "WalletRechargeStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AppointmentStatus" ADD VALUE 'CONFIRMED' BEFORE 'SAMPLE_COLLECTED';
ALTER TYPE "AppointmentStatus" ADD VALUE 'REACHED' BEFORE 'SAMPLE_COLLECTED';

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "booked_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_popular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offer_price" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "tests" ADD COLUMN     "booked_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_popular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offer_price" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "app_otp_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mobile" VARCHAR(15) NOT NULL,
    "otp_code" VARCHAR(6) NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'LOGIN',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_states" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(10),

    CONSTRAINT "app_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_cities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "state_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "app_cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mobile" VARCHAR(15) NOT NULL,
    "name" VARCHAR(150),
    "email" VARCHAR(255),
    "gender" "Gender",
    "dob" DATE,
    "profile_pic_url" TEXT,
    "city_id" UUID,
    "is_profile_complete" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_family_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_user_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "relation" "FamilyMemberRelation" NOT NULL,
    "upload_doc_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_user_id" UUID NOT NULL,
    "type" "AddressType" NOT NULL DEFAULT 'HOME',
    "house_no" VARCHAR(100),
    "apartment" VARCHAR(150),
    "address" TEXT NOT NULL,
    "locality" VARCHAR(150),
    "landmark" VARCHAR(150),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(6) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_banners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "image_url" TEXT,
    "thumbnail_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_coupons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(30) NOT NULL,
    "discount_type" "CouponDiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "max_discount_amount" DECIMAL(10,2),
    "min_subtotal" DECIMAL(10,2),
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "usage_limit_per_user" INTEGER,
    "total_usage_limit" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_coupon_redemptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coupon_id" UUID NOT NULL,
    "app_user_id" UUID NOT NULL,
    "order_id" UUID,
    "discount_amount" DECIMAL(10,2) NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_carts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_user_id" UUID NOT NULL,
    "coupon_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_cart_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cart_id" UUID NOT NULL,
    "item_type" "CatalogItemType" NOT NULL,
    "item_id" UUID NOT NULL,
    "family_member_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_service_centers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "image_url" TEXT,
    "address" TEXT NOT NULL,
    "phone" VARCHAR(15),
    "email" VARCHAR(255),
    "website" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "rating" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "opening_time" VARCHAR(10),
    "closing_time" VARCHAR(10),
    "center_type" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "facilities" JSONB NOT NULL DEFAULT '[]',
    "payment_methods" JSONB NOT NULL DEFAULT '[]',
    "photos" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_service_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_slots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "center_id" UUID,
    "slot_date" DATE NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "booked_count" INTEGER NOT NULL DEFAULT 0,
    "surcharge_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_number" VARCHAR(20) NOT NULL,
    "app_user_id" UUID NOT NULL,
    "address_id" UUID,
    "slot_id" UUID,
    "order_date" DATE NOT NULL,
    "status" "AppOrderStatus" NOT NULL DEFAULT 'PENDING',
    "is_draft" BOOLEAN NOT NULL DEFAULT true,
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "phlebotomy_charges" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "wallet_discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "coupon_id" UUID,
    "coupon_discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_payable" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_mode" "AppPaymentMode",
    "payment_status" "PaymentStatus",
    "service_pin" VARCHAR(10),
    "confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_order_appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "family_member_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_order_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_user_id" UUID NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "order_id" UUID,
    "wallet_recharge_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "gateway_order_id" VARCHAR(100),
    "gateway_payment_id" VARCHAR(100),
    "gateway_signature" TEXT,
    "status" "PaymentGatewayStatus" NOT NULL DEFAULT 'INITIATED',
    "signature_verified" BOOLEAN NOT NULL DEFAULT false,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_webhook_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gateway" VARCHAR(30) NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "gateway_payment_id" VARCHAR(100) NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_user_id" UUID NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_wallet_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wallet_id" UUID NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "source" "WalletTransactionSource" NOT NULL,
    "reference_id" UUID,
    "balance_after" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_recharge_offers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recharge_amount" DECIMAL(10,2) NOT NULL,
    "credit_amount" DECIMAL(10,2) NOT NULL,
    "bonus_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_recharge_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_wallet_recharges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_user_id" UUID NOT NULL,
    "offer_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "bonus_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "credit_amount" DECIMAL(10,2) NOT NULL,
    "status" "WalletRechargeStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_wallet_recharges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_prescriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_user_id" UUID NOT NULL,
    "family_member_id" UUID,
    "city_id" UUID,
    "query" TEXT,
    "file_url" TEXT NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "app_prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_support_tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticket_number" VARCHAR(20) NOT NULL,
    "app_user_id" UUID NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "screenshot_url" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "min_supported_version" VARCHAR(20) NOT NULL,
    "latest_version" VARCHAR(20) NOT NULL,
    "force_update" BOOLEAN NOT NULL DEFAULT false,
    "update_url" TEXT,
    "blog_url" TEXT,
    "faq_url" TEXT,
    "privacy_policy_url" TEXT,
    "terms_url" TEXT,
    "support_phone" VARCHAR(20),
    "support_whatsapp" VARCHAR(20),
    "support_email" VARCHAR(255),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_otp_codes_mobile_purpose_idx" ON "app_otp_codes"("mobile", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "app_cities_slug_key" ON "app_cities"("slug");

-- CreateIndex
CREATE INDEX "app_cities_state_id_idx" ON "app_cities"("state_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_mobile_key" ON "app_users"("mobile");

-- CreateIndex
CREATE INDEX "app_users_city_id_idx" ON "app_users"("city_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_family_members_patient_id_key" ON "app_family_members"("patient_id");

-- CreateIndex
CREATE INDEX "app_family_members_app_user_id_idx" ON "app_family_members"("app_user_id");

-- CreateIndex
CREATE INDEX "app_addresses_app_user_id_idx" ON "app_addresses"("app_user_id");

-- CreateIndex
-- Enforces "at most one default address per user" at the DB level (defense
-- in depth alongside the un-default-then-set transaction in the service
-- layer), so a race between two concurrent Set Default calls can never
-- leave two rows both marked default.
CREATE UNIQUE INDEX "app_addresses_one_default_per_user" ON "app_addresses"("app_user_id") WHERE "is_default" = true;

-- CreateIndex
CREATE UNIQUE INDEX "app_coupons_code_key" ON "app_coupons"("code");

-- CreateIndex
CREATE INDEX "app_coupon_redemptions_coupon_id_idx" ON "app_coupon_redemptions"("coupon_id");

-- CreateIndex
CREATE INDEX "app_coupon_redemptions_app_user_id_idx" ON "app_coupon_redemptions"("app_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_carts_app_user_id_key" ON "app_carts"("app_user_id");

-- CreateIndex
CREATE INDEX "app_cart_items_cart_id_idx" ON "app_cart_items"("cart_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_cart_items_cart_id_item_type_item_id_family_member_id_key" ON "app_cart_items"("cart_id", "item_type", "item_id", "family_member_id");

-- CreateIndex
CREATE INDEX "app_slots_slot_date_idx" ON "app_slots"("slot_date");

-- CreateIndex
CREATE UNIQUE INDEX "app_slots_center_id_slot_date_start_time_key" ON "app_slots"("center_id", "slot_date", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "app_orders_order_number_key" ON "app_orders"("order_number");

-- CreateIndex
CREATE INDEX "app_orders_app_user_id_idx" ON "app_orders"("app_user_id");

-- CreateIndex
CREATE INDEX "app_orders_status_idx" ON "app_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "app_order_appointments_appointment_id_key" ON "app_order_appointments"("appointment_id");

-- CreateIndex
CREATE INDEX "app_order_appointments_order_id_idx" ON "app_order_appointments"("order_id");

-- CreateIndex
CREATE INDEX "app_payments_app_user_id_idx" ON "app_payments"("app_user_id");

-- CreateIndex
CREATE INDEX "app_payments_gateway_order_id_idx" ON "app_payments"("gateway_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_webhook_events_gateway_event_type_gateway_payment_id_key" ON "app_webhook_events"("gateway", "event_type", "gateway_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_wallets_app_user_id_key" ON "app_wallets"("app_user_id");

-- CreateIndex
CREATE INDEX "app_wallet_transactions_wallet_id_idx" ON "app_wallet_transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "app_wallet_recharges_app_user_id_idx" ON "app_wallet_recharges"("app_user_id");

-- CreateIndex
CREATE INDEX "app_prescriptions_app_user_id_idx" ON "app_prescriptions"("app_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_support_tickets_ticket_number_key" ON "app_support_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "app_support_tickets_app_user_id_idx" ON "app_support_tickets"("app_user_id");

-- AddForeignKey
ALTER TABLE "app_cities" ADD CONSTRAINT "app_cities_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "app_states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_users" ADD CONSTRAINT "app_users_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "app_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_family_members" ADD CONSTRAINT "app_family_members_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_family_members" ADD CONSTRAINT "app_family_members_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_addresses" ADD CONSTRAINT "app_addresses_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_coupon_redemptions" ADD CONSTRAINT "app_coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "app_coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_coupon_redemptions" ADD CONSTRAINT "app_coupon_redemptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "app_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_carts" ADD CONSTRAINT "app_carts_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_carts" ADD CONSTRAINT "app_carts_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "app_coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_cart_items" ADD CONSTRAINT "app_cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "app_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_cart_items" ADD CONSTRAINT "app_cart_items_family_member_id_fkey" FOREIGN KEY ("family_member_id") REFERENCES "app_family_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_slots" ADD CONSTRAINT "app_slots_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "app_service_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_orders" ADD CONSTRAINT "app_orders_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_orders" ADD CONSTRAINT "app_orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "app_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_orders" ADD CONSTRAINT "app_orders_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "app_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_orders" ADD CONSTRAINT "app_orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "app_coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_order_appointments" ADD CONSTRAINT "app_order_appointments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "app_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_order_appointments" ADD CONSTRAINT "app_order_appointments_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_order_appointments" ADD CONSTRAINT "app_order_appointments_family_member_id_fkey" FOREIGN KEY ("family_member_id") REFERENCES "app_family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_payments" ADD CONSTRAINT "app_payments_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_payments" ADD CONSTRAINT "app_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "app_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_payments" ADD CONSTRAINT "app_payments_wallet_recharge_id_fkey" FOREIGN KEY ("wallet_recharge_id") REFERENCES "app_wallet_recharges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_wallets" ADD CONSTRAINT "app_wallets_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_wallet_transactions" ADD CONSTRAINT "app_wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "app_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_wallet_recharges" ADD CONSTRAINT "app_wallet_recharges_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_wallet_recharges" ADD CONSTRAINT "app_wallet_recharges_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "app_recharge_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_prescriptions" ADD CONSTRAINT "app_prescriptions_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_prescriptions" ADD CONSTRAINT "app_prescriptions_family_member_id_fkey" FOREIGN KEY ("family_member_id") REFERENCES "app_family_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_prescriptions" ADD CONSTRAINT "app_prescriptions_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "app_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_support_tickets" ADD CONSTRAINT "app_support_tickets_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

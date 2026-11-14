-- WhatsApp AI booking assistant (services/whatsapp/).
-- Hand-written from `prisma migrate diff` of exactly this feature's schema
-- change and applied with `prisma migrate resolve --applied` — a plain
-- `migrate dev` would sweep unrelated pending schema changes in with it.
-- Purely additive: new tables/enums + one new AppPlatform value.

-- CreateEnum
CREATE TYPE "WhatsappDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "WhatsappAuthor" AS ENUM ('CUSTOMER', 'AI', 'STAFF', 'SYSTEM', 'TEMPLATE');

-- CreateEnum
CREATE TYPE "WhatsappDraftStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'EXPIRED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "AppPlatform" ADD VALUE 'WHATSAPP';

-- CreateTable
CREATE TABLE "whatsapp_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "label" VARCHAR(100) NOT NULL DEFAULT 'Main',
    "phone_number_id" VARCHAR(50) NOT NULL,
    "waba_id" VARCHAR(50),
    "display_phone" VARCHAR(20),
    "access_token_enc" TEXT,
    "app_secret_enc" TEXT,
    "verify_token" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_webhook_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL,
    "contact_phone" VARCHAR(20) NOT NULL,
    "wa_id" VARCHAR(20) NOT NULL,
    "contact_name" VARCHAR(150),
    "app_user_id" UUID,
    "last_inbound_at" TIMESTAMP(3),
    "last_message_at" TIMESTAMP(3),
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "human_takeover" BOOLEAN NOT NULL DEFAULT false,
    "needs_human" BOOLEAN NOT NULL DEFAULT false,
    "handoff_reason" VARCHAR(100),
    "handoff_summary" TEXT,
    "handoff_at" TIMESTAMP(3),
    "report_check_failures" INTEGER NOT NULL DEFAULT 0,
    "report_check_locked_until" TIMESTAMP(3),
    "report_verified_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "wamid" VARCHAR(255),
    "direction" "WhatsappDirection" NOT NULL,
    "author" "WhatsappAuthor" NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "body" TEXT,
    "payload" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'received',
    "error" TEXT,
    "staff_user_id" UUID,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_booking_drafts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "summary_hash" VARCHAR(64) NOT NULL,
    "status" "WhatsappDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "app_order_id" UUID,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_booking_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_ai_replies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID,
    "inbound_message_id" UUID,
    "reply_message_id" UUID,
    "question" TEXT,
    "answer" TEXT,
    "tool_calls" JSONB,
    "model" VARCHAR(50) NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cache_read_tokens" INTEGER NOT NULL DEFAULT 0,
    "cache_write_tokens" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL,
    "error" TEXT,
    "handoff" BOOLEAN NOT NULL DEFAULT false,
    "dry_run" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_ai_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_ai_settings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "anthropic_key_enc" TEXT,
    "model" VARCHAR(50) NOT NULL DEFAULT 'claude-haiku-5-5',
    "max_replies_per_hour" INTEGER NOT NULL DEFAULT 20,
    "voice_enabled" BOOLEAN NOT NULL DEFAULT true,
    "stt_provider" VARCHAR(20) NOT NULL DEFAULT 'groq',
    "stt_key_enc" TEXT,
    "brand_name" VARCHAR(100) NOT NULL DEFAULT 'Example Diagnostics Lab',
    "business_instructions" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_ai_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_knowledge_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_knowledge_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concern_test_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "concern" VARCHAR(200) NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "test_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "package_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concern_test_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_accounts_phone_number_id_key" ON "whatsapp_accounts"("phone_number_id");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_needs_human_idx" ON "whatsapp_conversations"("needs_human");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_last_message_at_idx" ON "whatsapp_conversations"("last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_conversations_account_id_contact_phone_key" ON "whatsapp_conversations"("account_id", "contact_phone");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_wamid_key" ON "whatsapp_messages"("wamid");

-- CreateIndex
CREATE INDEX "whatsapp_messages_conversation_id_sent_at_idx" ON "whatsapp_messages"("conversation_id", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_booking_drafts_app_order_id_key" ON "whatsapp_booking_drafts"("app_order_id");

-- CreateIndex
CREATE INDEX "whatsapp_booking_drafts_conversation_id_status_idx" ON "whatsapp_booking_drafts"("conversation_id", "status");

-- CreateIndex
CREATE INDEX "whatsapp_ai_replies_conversation_id_created_at_idx" ON "whatsapp_ai_replies"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "whatsapp_ai_replies_created_at_idx" ON "whatsapp_ai_replies"("created_at");

-- CreateIndex
CREATE INDEX "whatsapp_ai_replies_status_idx" ON "whatsapp_ai_replies"("status");

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "whatsapp_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_booking_drafts" ADD CONSTRAINT "whatsapp_booking_drafts_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_booking_drafts" ADD CONSTRAINT "whatsapp_booking_drafts_app_order_id_fkey" FOREIGN KEY ("app_order_id") REFERENCES "app_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_ai_replies" ADD CONSTRAINT "whatsapp_ai_replies_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;


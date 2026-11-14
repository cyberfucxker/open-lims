import type { PaymentGatewayConfig } from "@prisma/client";
import { prisma } from "../config/database";
import type { PaymentGatewayConfigDto } from "../types/paymentGatewayConfig.types";

const SINGLETON_ID = "default";

export function toPaymentGatewayConfigDto(config: PaymentGatewayConfig): PaymentGatewayConfigDto {
  return {
    razorpayKeyId: config.razorpayKeyId,
    razorpayKeySecretMasked: config.razorpayKeySecret
      ? `••••${config.razorpayKeySecret.slice(-4)}`
      : null,
    razorpayKeySecretConfigured: Boolean(config.razorpayKeySecret),
    updatedAt: config.updatedAt.toISOString(),
  };
}

export function getOrCreatePaymentGatewayConfig() {
  return prisma.paymentGatewayConfig.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });
}

export function updatePaymentGatewayConfig(data: {
  razorpayKeyId: string;
  razorpayKeySecret?: string;
}) {
  const write = {
    razorpayKeyId: data.razorpayKeyId,
    ...(data.razorpayKeySecret ? { razorpayKeySecret: data.razorpayKeySecret } : {}),
  };
  return prisma.paymentGatewayConfig.upsert({
    where: { id: SINGLETON_ID },
    update: write,
    create: { id: SINGLETON_ID, ...write },
  });
}

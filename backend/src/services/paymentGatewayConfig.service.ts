import * as paymentGatewayConfigRepository from "../repositories/paymentGatewayConfig.repository";
import { toPaymentGatewayConfigDto } from "../repositories/paymentGatewayConfig.repository";
import type {
  PaymentGatewayConfigDto,
  PaymentGatewayConfigWriteData,
} from "../types/paymentGatewayConfig.types";

export async function getPaymentGatewayConfig(): Promise<PaymentGatewayConfigDto> {
  const config = await paymentGatewayConfigRepository.getOrCreatePaymentGatewayConfig();
  return toPaymentGatewayConfigDto(config);
}

export async function updatePaymentGatewayConfig(
  values: PaymentGatewayConfigWriteData,
): Promise<PaymentGatewayConfigDto> {
  const config = await paymentGatewayConfigRepository.updatePaymentGatewayConfig(values);
  return toPaymentGatewayConfigDto(config);
}

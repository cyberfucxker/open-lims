import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

export interface PaymentGatewayConfigDto {
  razorpayKeyId: string | null;
  /** Last 4 chars only, e.g. "••••EEu5" — the real secret is never returned. */
  razorpayKeySecretMasked: string | null;
  razorpayKeySecretConfigured: boolean;
  updatedAt: string;
}

export interface PaymentGatewayConfigWriteData {
  razorpayKeyId: string;
  /** Omit/blank to keep the existing stored secret unchanged. */
  razorpayKeySecret?: string;
}

export async function fetchPaymentGatewayConfig(): Promise<PaymentGatewayConfigDto> {
  const response = await httpClient.get<ApiResponseBody<PaymentGatewayConfigDto>>(
    "/payment-gateway-config",
    { suppressErrorToast: true },
  );
  return response.data.data as PaymentGatewayConfigDto;
}

export async function updatePaymentGatewayConfigApi(
  values: PaymentGatewayConfigWriteData,
): Promise<PaymentGatewayConfigDto> {
  const response = await httpClient.put<ApiResponseBody<PaymentGatewayConfigDto>>(
    "/payment-gateway-config",
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as PaymentGatewayConfigDto;
}

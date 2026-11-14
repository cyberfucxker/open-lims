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

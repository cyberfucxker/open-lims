export type PaymentPurpose = "order_payment" | "wallet_recharge" | "third_party_lab_balance";
export type PaymentGatewayStatus = "INITIATED" | "SUCCESS" | "FAILED";

export interface CreatePaymentOrderRequest {
  purpose: PaymentPurpose;
  reference_id: string;
  /** Required when purpose is "third_party_lab_balance" — the partner
   *  UserFID the report list was fetched with. */
  third_party_user_fid?: string;
}

export interface CreatePaymentOrderResult {
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key: string;
  payment_id: string;
  purpose: PaymentPurpose;
  reference_id: string;
}

export interface VerifyPaymentRequest {
  payment_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResult {
  payment_id: string;
  purpose: PaymentPurpose;
  reference_id: string;
  status: "success" | "failed";
  signature_verified: boolean;
}

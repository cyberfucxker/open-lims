import { delay, newId } from "../delay";
import type {
  CreatePaymentOrderRequest,
  CreatePaymentOrderResult,
  VerifyPaymentRequest,
  VerifyPaymentResult,
} from "@/types";

/** Simulates a Razorpay order + a near-always-successful verification (90% success) so
 *  the Payment screen's failure/retry path is reachable without a real gateway. */
export const paymentApi = {
  async createOrder(
    payload: CreatePaymentOrderRequest,
    amount: number,
  ): Promise<CreatePaymentOrderResult> {
    return delay({
      razorpay_order_id: newId("order_rzp"),
      amount: amount * 100,
      currency: "INR",
      key: "rzp_test_mock_key",
      payment_id: newId("pay"),
      purpose: payload.purpose,
      reference_id: payload.reference_id,
    });
  },

  async verify(payload: VerifyPaymentRequest): Promise<VerifyPaymentResult> {
    const success = Math.random() > 0.1;
    return delay(
      {
        payment_id: payload.payment_id,
        purpose: "order_payment",
        reference_id: payload.razorpay_order_id,
        status: success ? "success" : "failed",
        signature_verified: success,
      },
      900,
    );
  },
};

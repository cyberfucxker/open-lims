import { httpClient } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type {
  CreatePaymentOrderRequest,
  CreatePaymentOrderResult,
  VerifyPaymentRequest,
  VerifyPaymentResult,
} from "@/types";

/** Real replacement for `mocks/api/paymentApi.ts` — matches
 *  `POST /user/payments/create-order` and `POST /user/payments/verify`.
 *  The backend computes the authoritative amount itself (from the order/
 *  recharge row), so the `amount` param the mock used purely for its fake
 *  response is accepted for call-site compatibility but ignored here. */
export const paymentApi = {
  async createOrder(
    payload: CreatePaymentOrderRequest,
    _amount?: number,
  ): Promise<CreatePaymentOrderResult> {
    const response = await httpClient.post<AppApiResponseBody<CreatePaymentOrderResult>>(
      "/user/payments/create-order",
      payload,
    );
    return response.data.data as CreatePaymentOrderResult;
  },

  async verify(payload: VerifyPaymentRequest): Promise<VerifyPaymentResult> {
    const response = await httpClient.post<AppApiResponseBody<VerifyPaymentResult>>(
      "/user/payments/verify",
      payload,
    );
    return response.data.data as VerifyPaymentResult;
  },
};

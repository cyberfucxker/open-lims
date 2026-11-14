import { httpClient } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type {
  CancelOrderRequest,
  ConfirmOrderRequest,
  ConfirmOrderResult,
  CreateHomeVisitRequest,
  CreateHomeVisitResult,
  OrderDetail,
  OrderListItem,
  OrdersFilter,
  ReviewCartRequest,
  ReviewCartResult,
} from "@/types";

/** Real replacement for `mocks/api/orderApi.ts` — matches
 *  `POST /user/review-cart`, `POST /user/confirm-order`, `GET /user/orders`,
 *  `GET /user/orders/:id`, `PATCH /user/orders/:orderId/cancel`. Response
 *  shapes are already field-for-field identical to the mock's types. */
export const orderApi = {
  async reviewCart(payload: ReviewCartRequest): Promise<ReviewCartResult> {
    const response = await httpClient.post<AppApiResponseBody<ReviewCartResult>>(
      "/user/review-cart",
      payload,
    );
    return response.data.data as ReviewCartResult;
  },

  async confirmOrder(payload: ConfirmOrderRequest): Promise<ConfirmOrderResult> {
    const response = await httpClient.post<AppApiResponseBody<ConfirmOrderResult>>(
      "/user/confirm-order",
      payload,
    );
    return response.data.data as ConfirmOrderResult;
  },

  async listOrders(filter: OrdersFilter = "all"): Promise<OrderListItem[]> {
    const response = await httpClient.get<AppApiResponseBody<OrderListItem[]>>("/user/orders", {
      params: { status: filter },
    });
    return response.data.data ?? [];
  },

  async getOrderDetail(id: string): Promise<OrderDetail | null> {
    const response = await httpClient.get<AppApiResponseBody<OrderDetail>>(`/user/orders/${id}`);
    return response.data.data;
  },

  async cancelOrder(id: string, payload: CancelOrderRequest): Promise<null> {
    await httpClient.patch(`/user/orders/${id}/cancel`, payload);
    return null;
  },

  async createHomeVisit(payload: CreateHomeVisitRequest): Promise<CreateHomeVisitResult> {
    const response = await httpClient.post<AppApiResponseBody<CreateHomeVisitResult>>(
      "/user/home-visits",
      payload,
    );
    return response.data.data as CreateHomeVisitResult;
  },
};

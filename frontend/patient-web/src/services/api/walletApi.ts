import { httpClient } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type {
  InitiateRechargeRequest,
  InitiateRechargeResult,
  RechargeOffersResult,
  VerifyRechargeRequest,
  VerifyRechargeResult,
  WalletBalanceResult,
  WalletTransactionsResult,
} from "@/types";

/** Real replacement for `mocks/api/walletApi.ts` — matches
 *  `GET /user/recharge-offers`, `GET /user/wallet/balance`,
 *  `POST /user/wallet/recharge/initiate`, `POST /user/wallet/recharge/verify`,
 *  `GET /user/wallet/transactions`. */
export const walletApi = {
  async getRechargeOffers(): Promise<RechargeOffersResult> {
    const response =
      await httpClient.get<AppApiResponseBody<RechargeOffersResult>>("/user/recharge-offers");
    return response.data.data as RechargeOffersResult;
  },

  async getBalance(): Promise<WalletBalanceResult> {
    const response =
      await httpClient.get<AppApiResponseBody<WalletBalanceResult>>("/user/wallet/balance");
    return response.data.data as WalletBalanceResult;
  },

  async initiateRecharge(payload: InitiateRechargeRequest): Promise<InitiateRechargeResult> {
    const response = await httpClient.post<AppApiResponseBody<InitiateRechargeResult>>(
      "/user/wallet/recharge/initiate",
      payload,
    );
    return response.data.data as InitiateRechargeResult;
  },

  async verifyRecharge(payload: VerifyRechargeRequest): Promise<VerifyRechargeResult> {
    const response = await httpClient.post<AppApiResponseBody<VerifyRechargeResult>>(
      "/user/wallet/recharge/verify",
      payload,
    );
    return response.data.data as VerifyRechargeResult;
  },

  async getTransactions(): Promise<WalletTransactionsResult> {
    const response = await httpClient.get<AppApiResponseBody<WalletTransactionsResult>>(
      "/user/wallet/transactions",
    );
    return response.data.data as WalletTransactionsResult;
  },
};

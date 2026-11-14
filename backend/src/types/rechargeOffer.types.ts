export interface RechargeOfferDto {
  id: string;
  rechargeAmount: number;
  bonusAmount: number;
  creditAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Admin-facing write shape — creditAmount is never accepted from the
 *  client, it's always server-computed as rechargeAmount + bonusAmount
 *  to match the invariant `app/wallet.service.ts#initiateRecharge` relies
 *  on when a user actually redeems an offer. */
export interface RechargeOfferWriteData {
  rechargeAmount: number;
  bonusAmount: number;
  isActive?: boolean;
}

export interface ListRechargeOffersParams {
  isActive?: string;
  page?: number;
  pageSize?: number;
}

export interface ListRechargeOffersResult {
  rows: RechargeOfferDto[];
  total: number;
}

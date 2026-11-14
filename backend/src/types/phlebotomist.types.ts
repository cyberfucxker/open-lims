export interface PhlebotomistDto {
  id: string;
  name: string;
  mobile: string;
  photoUrl: string | null;
  isActive: boolean;
  /** Slot Template system fields — home city, covered areas, daily working
   *  hours. All nullable/empty for phlebotomists created before this. */
  cityId: string | null;
  cityName: string | null;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  serviceAreas: Array<{ id: string; name: string }>;
  /** Set when a franchise created this phlebo from its own portal — null
   *  for every admin-created one. */
  createdByOrganizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PhlebotomistWriteData {
  name: string;
  mobile: string;
  photoUrl?: string | null;
  isActive?: boolean;
  cityId?: string | null;
  workingHoursStart?: string | null;
  workingHoursEnd?: string | null;
  serviceAreaIds?: string[];
}

export interface ListPhlebotomistsParams {
  search?: string;
  isActive?: string;
  cityId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListPhlebotomistsResult {
  rows: PhlebotomistDto[];
  total: number;
}

/** Everything the Superadmin Phlebotomist Profile page needs beyond the
 *  basic identity fields above — derived live from `AppOrder.phleboId`
 *  rather than tracked separately (see `getPhlebotomistStats`'s
 *  doc-comment for what's genuinely NOT trackable yet — ratings, payouts,
 *  attendance — and stays out of this DTO on purpose). */
export interface PhlebotomistStatsDto {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  rejectedOrders: number;
  /** Assigned and accepted, but not yet at a terminal state — on the way,
   *  reached, sample collected/dropped. */
  inProgressOrders: number;
  /** Assigned but not yet actioned by the phlebo. */
  pendingOrders: number;
  /** `completedOrders / totalOrders`, as a whole-number percentage. 0 when
   *  there are no orders yet, rather than NaN. */
  completionRate: number;
  /** Sum of `totalPayable` across every cash order this phlebo has actually
   *  collected COD on (`codCollectedAt` set) — what they've handled in cash,
   *  not what they're owed or have remitted (no payout ledger exists). */
  codCollectedTotal: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
}

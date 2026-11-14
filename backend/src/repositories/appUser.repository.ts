import type {
  Address,
  AppOrder,
  AppUser,
  City,
  Prisma,
  Wallet,
  WalletTransaction,
} from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import type {
  AdjustWalletInput,
  AppUserAddressDto,
  AppUserListRowDto,
  AppUserOrderDto,
  AppUserProfileDto,
  AppUserWalletDto,
  AppUserWalletTransactionDto,
  UpdateAppUserInput,
  WalletStatsDto,
} from "../types/appUser.types";

export interface ListAppUsersFilter {
  search?: string;
  cityId?: string;
  isActive?: string;
  registeredFrom?: string;
  registeredTo?: string;
  minBalance?: number;
  maxBalance?: number;
  /** Audience-segment style filter ("N+ orders") — resolved via a pre-pass
   *  over AppOrder in `listAppUsers`, not part of `buildWhere`'s plain
   *  column checks (Prisma's `groupBy` can't express a HAVING clause). */
  minOrderCount?: number;
  sortBy?: "createdAt" | "walletBalance";
  sortDir?: "asc" | "desc";
  skip: number;
  take: number;
}

type AppUserWithListRelations = AppUser & { city: City | null; wallet: Wallet | null };
type AppUserWithProfileRelations = AppUser & { city: City | null };

const appUserListInclude = {
  city: true,
  wallet: true,
} satisfies Prisma.AppUserInclude;

/** Maps a list row (with its joined city/wallet) plus its precomputed order
 *  count into the exact shape the frontend list table expects. */
export function toAppUserListRowDto(
  appUser: AppUserWithListRelations,
  orderCount: number,
): AppUserListRowDto {
  return {
    id: appUser.id,
    name: appUser.name,
    mobile: appUser.mobile,
    email: appUser.email,
    cityName: appUser.city?.name ?? null,
    isActive: appUser.isActive,
    isProfileComplete: appUser.isProfileComplete,
    orderCount,
    walletBalance: appUser.wallet ? Number(appUser.wallet.balance) : 0,
    platform: appUser.platform ?? "WEB",
    createdAt: appUser.createdAt.toISOString(),
  };
}

export function toAppUserProfileDto(appUser: AppUserWithProfileRelations): AppUserProfileDto {
  return {
    id: appUser.id,
    name: appUser.name,
    mobile: appUser.mobile,
    email: appUser.email,
    gender: appUser.gender,
    dob: appUser.dob ? appUser.dob.toISOString() : null,
    city: appUser.city ? { id: appUser.city.id, name: appUser.city.name } : null,
    isProfileComplete: appUser.isProfileComplete,
    isActive: appUser.isActive,
    createdAt: appUser.createdAt.toISOString(),
  };
}

export function toAppUserAddressDto(address: Address): AppUserAddressDto {
  return {
    id: address.id,
    type: address.type,
    houseNo: address.houseNo,
    apartment: address.apartment,
    address: address.address,
    locality: address.locality,
    landmark: address.landmark,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    isDefault: address.isDefault,
  };
}

export function toAppUserWalletTransactionDto(
  transaction: WalletTransaction,
): AppUserWalletTransactionDto {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: Number(transaction.amount),
    source: transaction.source,
    referenceId: transaction.referenceId,
    note: transaction.note,
    balanceAfter: Number(transaction.balanceAfter),
    createdAt: transaction.createdAt.toISOString(),
  };
}

/** No Wallet row exists until the first recharge/debit — an empty-balance
 *  wallet is the correct representation, not a 404. */
export function toEmptyAppUserWalletDto(): AppUserWalletDto {
  return { balance: 0, currency: "INR", transactions: [] };
}

export function toAppUserWalletDto(
  wallet: Wallet & { transactions: WalletTransaction[] },
): AppUserWalletDto {
  return {
    balance: Number(wallet.balance),
    currency: wallet.currency,
    transactions: wallet.transactions.map(toAppUserWalletTransactionDto),
  };
}

export function toAppUserOrderDto(order: AppOrder): AppUserOrderDto {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderDate: order.orderDate.toISOString(),
    status: order.status,
    totalPayable: Number(order.totalPayable),
    paymentMode: order.paymentMode,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<
    ListAppUsersFilter,
    | "search"
    | "cityId"
    | "isActive"
    | "registeredFrom"
    | "registeredTo"
    | "minBalance"
    | "maxBalance"
  >,
): Prisma.AppUserWhereInput {
  const where: Prisma.AppUserWhereInput = {};

  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { email: { contains: filter.search, mode: "insensitive" } },
      { mobile: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter.cityId) {
    where.cityId = filter.cityId;
  }
  if (filter.isActive === "true") {
    where.isActive = true;
  } else if (filter.isActive === "false") {
    where.isActive = false;
  }
  if (filter.registeredFrom || filter.registeredTo) {
    where.createdAt = {};
    if (filter.registeredFrom) {
      where.createdAt.gte = new Date(filter.registeredFrom);
    }
    if (filter.registeredTo) {
      const end = new Date(filter.registeredTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  if (filter.minBalance != null || filter.maxBalance != null) {
    where.wallet = {
      balance: {
        ...(filter.minBalance != null ? { gte: filter.minBalance } : {}),
        ...(filter.maxBalance != null ? { lte: filter.maxBalance } : {}),
      },
    };
  }

  return where;
}

/** Which AppUsers have at least `minOrderCount` non-draft orders. Prisma's
 *  `groupBy` can't express a HAVING clause directly, so the threshold is
 *  applied in JS over the aggregate. Fine at this table's size (one lab's
 *  patient base); would need a raw SQL HAVING if that ever changes. */
async function resolveAppUserIdsWithMinOrderCount(minOrderCount: number): Promise<string[]> {
  const groups = await prisma.appOrder.groupBy({
    by: ["appUserId"],
    where: { isDraft: false },
    _count: { _all: true },
  });
  return groups
    .filter((group) => group._count._all >= minOrderCount)
    .map((group) => group.appUserId);
}

export async function listAppUsers(filter: ListAppUsersFilter): Promise<{
  rows: AppUserWithListRelations[];
  total: number;
  orderCountByAppUserId: Map<string, number>;
}> {
  const where = buildWhere(filter);

  if (filter.minOrderCount != null && filter.minOrderCount > 0) {
    where.id = { in: await resolveAppUserIdsWithMinOrderCount(filter.minOrderCount) };
  }

  const sortDir = filter.sortDir ?? "desc";
  const orderBy: Prisma.AppUserOrderByWithRelationInput =
    filter.sortBy === "walletBalance" ? { wallet: { balance: sortDir } } : { createdAt: sortDir };

  const [rows, total] = await Promise.all([
    prisma.appUser.findMany({
      where,
      include: appUserListInclude,
      orderBy,
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.appUser.count({ where }),
  ]);

  // Single grouped query for the whole page's order counts — avoids an
  // N+1 count-per-row while still excluding abandoned (isDraft) orders.
  const orderCounts = rows.length
    ? await prisma.appOrder.groupBy({
        by: ["appUserId"],
        where: { appUserId: { in: rows.map((row) => row.id) }, isDraft: false },
        _count: { _all: true },
      })
    : [];

  const orderCountByAppUserId = new Map(
    orderCounts.map((entry) => [entry.appUserId, entry._count._all]),
  );

  return { rows, total, orderCountByAppUserId };
}

/** Every AppUser matching an audience filter (no pagination — a push send
 *  needs the whole segment, not a page of it), with just enough fields to
 *  dispatch a notification. Reuses the same `buildWhere`/order-count
 *  resolution as `listAppUsers` so a campaign's audience is guaranteed to be
 *  the same set the admin saw the count for. */
export async function listAppUserPushTargets(
  filter: Pick<
    ListAppUsersFilter,
    "search" | "cityId" | "isActive" | "registeredFrom" | "registeredTo" | "minOrderCount"
  >,
): Promise<{ id: string; name: string | null; fcmToken: string | null }[]> {
  const where = buildWhere(filter);
  if (filter.minOrderCount != null && filter.minOrderCount > 0) {
    where.id = { in: await resolveAppUserIdsWithMinOrderCount(filter.minOrderCount) };
  }
  return prisma.appUser.findMany({ where, select: { id: true, name: true, fcmToken: true } });
}

export function findAppUserById(id: string) {
  return prisma.appUser.findUnique({ where: { id }, include: { city: true } });
}

export function listAddressesByAppUserId(appUserId: string) {
  return prisma.address.findMany({
    where: { appUserId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export function findWalletWithTransactions(appUserId: string) {
  return prisma.wallet.findUnique({
    where: { appUserId },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
}

export function listOrdersByAppUserId(appUserId: string) {
  return prisma.appOrder.findMany({
    where: { appUserId, isDraft: false },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export function setAppUserStatus(id: string, isActive: boolean) {
  return prisma.appUser.update({ where: { id }, data: { isActive }, include: { city: true } });
}

export function updateAppUser(id: string, data: UpdateAppUserInput) {
  return prisma.appUser.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      gender: data.gender,
      dob: data.dob ? new Date(data.dob) : data.dob,
      cityId: data.cityId,
    },
    include: { city: true },
  });
}

/** Aggregate stats over ALL customer wallets — true sum/avg aggregates that,
 *  unlike Customers page's plain counts, can't be derived from a `total`
 *  on a filtered list query, so this is a small dedicated query. */
export async function getWalletStats(): Promise<WalletStatsDto> {
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const [balanceAgg, customersWithBalance, creditsAgg] = await Promise.all([
    prisma.wallet.aggregate({ _sum: { balance: true }, _avg: { balance: true } }),
    prisma.wallet.count({ where: { balance: { gt: 0 } } }),
    prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "CREDIT", createdAt: { gte: firstOfMonth } },
    }),
  ]);

  return {
    totalLiability: Number(balanceAgg._sum.balance ?? 0),
    customersWithBalance,
    avgBalance: Number(balanceAgg._avg.balance ?? 0),
    totalCreditsThisMonth: Number(creditsAgg._sum.amount ?? 0),
  };
}

/** Manual admin credit/debit — the whole read-check-write happens inside one
 *  transaction so a concurrent adjustment can't race past the debit guard,
 *  same pattern as `sample.repository.ts`'s guarded status transitions. */
export async function adjustWallet(
  appUserId: string,
  input: AdjustWalletInput,
  performedByUserId: string | undefined,
): Promise<Wallet & { transactions: WalletTransaction[] }> {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { appUserId },
      update: {},
      create: { appUserId },
    });

    const currentBalance = Number(wallet.balance);
    if (input.type === "DEBIT" && input.amount > currentBalance) {
      throw ApiError.badRequest("Insufficient wallet balance");
    }

    const balanceAfter =
      input.type === "CREDIT" ? currentBalance + input.amount : currentBalance - input.amount;

    await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter } });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: input.type,
        amount: input.amount,
        source: "MANUAL_ADJUSTMENT",
        note: input.reason,
        performedByUserId,
        balanceAfter,
      },
    });

    return tx.wallet.findUniqueOrThrow({
      where: { id: wallet.id },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
    });
  });
}

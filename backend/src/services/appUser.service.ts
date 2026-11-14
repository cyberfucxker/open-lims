import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as appUserRepository from "../repositories/appUser.repository";
import {
  toAppUserAddressDto,
  toAppUserListRowDto,
  toAppUserOrderDto,
  toAppUserProfileDto,
  toAppUserWalletDto,
  toEmptyAppUserWalletDto,
} from "../repositories/appUser.repository";
import type {
  AdjustWalletInput,
  AppUserDetailDto,
  AppUserProfileDto,
  AppUserWalletDto,
  ListAppUsersParams,
  ListAppUsersResult,
  UpdateAppUserInput,
  WalletStatsDto,
} from "../types/appUser.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Customer not found");
      }
      if (error.code === "P2003") {
        throw ApiError.badRequest("Selected city does not exist");
      }
    }
    throw error;
  }
}

export async function listAppUsers(params: ListAppUsersParams): Promise<ListAppUsersResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total, orderCountByAppUserId } = await appUserRepository.listAppUsers({
    search: params.search,
    cityId: params.cityId,
    isActive: params.isActive,
    registeredFrom: params.registeredFrom,
    registeredTo: params.registeredTo,
    minBalance: params.minBalance,
    maxBalance: params.maxBalance,
    minOrderCount: params.minOrderCount,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    rows: rows.map((row) => toAppUserListRowDto(row, orderCountByAppUserId.get(row.id) ?? 0)),
    total,
  };
}

export async function getAppUserDetail(id: string): Promise<AppUserDetailDto> {
  const appUser = await appUserRepository.findAppUserById(id);
  if (!appUser) {
    throw ApiError.notFound("Customer not found");
  }

  const [addresses, wallet, orders] = await Promise.all([
    appUserRepository.listAddressesByAppUserId(id),
    appUserRepository.findWalletWithTransactions(id),
    appUserRepository.listOrdersByAppUserId(id),
  ]);

  return {
    profile: toAppUserProfileDto(appUser),
    addresses: addresses.map(toAppUserAddressDto),
    wallet: wallet ? toAppUserWalletDto(wallet) : toEmptyAppUserWalletDto(),
    orders: orders.map(toAppUserOrderDto),
  };
}

export async function setAppUserStatus(id: string, isActive: boolean): Promise<AppUserProfileDto> {
  const appUser = await withTranslatedErrors(() =>
    appUserRepository.setAppUserStatus(id, isActive),
  );
  return toAppUserProfileDto(appUser);
}

export async function updateAppUser(
  id: string,
  values: UpdateAppUserInput,
): Promise<AppUserProfileDto> {
  const appUser = await withTranslatedErrors(() => appUserRepository.updateAppUser(id, values));
  return toAppUserProfileDto(appUser);
}

export function getWalletStats(): Promise<WalletStatsDto> {
  return appUserRepository.getWalletStats();
}

export async function adjustWallet(
  appUserId: string,
  input: AdjustWalletInput,
  performedByUserId: string | undefined,
): Promise<AppUserWalletDto> {
  const wallet = await withTranslatedErrors(() =>
    appUserRepository.adjustWallet(appUserId, input, performedByUserId),
  );
  return toAppUserWalletDto(wallet);
}

import type { AppPlatform } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { toRelationLabel } from "../../utils/enumMappers";
import { resolveSelfFamilyMemberId } from "./catalog.service";
import { checkCouponEligibility, findCouponByCode } from "./coupon.util";

export interface ResolvedCartItem {
  id: string;
  testName: string;
  testCode: string;
  salePrice: number;
  mrp: number;
  discountPercentage: number;
  /** Who this line is booked for. Null only for a legacy row added before
   *  members existed — checkout refuses to proceed with one (see
   *  `loadCheckoutCart`). The same test for two people is two lines with the
   *  same `testName` and different ids, which is exactly how one order comes
   *  to cover a whole family. */
  familyMemberId: string | null;
}

/** Exported for reuse by the Orders module (Review Cart/Confirm Order need
 *  the exact same live-price resolution Get Cart uses). */
export async function resolveCartItems(
  items: Array<{
    id: string;
    itemType: "TEST" | "PACKAGE";
    itemId: string;
    familyMemberId?: string | null;
  }>,
): Promise<ResolvedCartItem[]> {
  const testIds = items.filter((i) => i.itemType === "TEST").map((i) => i.itemId);
  const packageIds = items.filter((i) => i.itemType === "PACKAGE").map((i) => i.itemId);

  const [tests, packages] = await Promise.all([
    testIds.length ? prisma.test.findMany({ where: { id: { in: testIds } } }) : [],
    packageIds.length ? prisma.package.findMany({ where: { id: { in: packageIds } } }) : [],
  ]);

  const testById = new Map(tests.map((t) => [t.id, t]));
  const packageById = new Map(packages.map((p) => [p.id, p]));

  return items.flatMap((item) => {
    const source =
      item.itemType === "TEST" ? testById.get(item.itemId) : packageById.get(item.itemId);
    if (!source) return []; // catalog item removed/deactivated since it was added

    const mrp = Number(source.price);
    const salePrice = Number(source.offerPrice ?? source.price);
    const discountPercentage = mrp > 0 ? Math.round(((mrp - salePrice) / mrp) * 100) : 0;
    const code =
      item.itemType === "TEST"
        ? (source as { shortName: string }).shortName
        : `PKG-${source.id.slice(0, 6).toUpperCase()}`;

    return [
      {
        id: item.id,
        testName: source.name,
        testCode: code,
        salePrice,
        mrp,
        discountPercentage,
        familyMemberId: item.familyMemberId ?? null,
      },
    ];
  });
}

async function getOrCreateWallet(appUserId: string) {
  return prisma.wallet.upsert({
    where: { appUserId },
    update: {},
    create: { appUserId },
  });
}

export interface CartCustomer {
  familyMemberId: string;
  name: string;
  relation: string;
  /** How many cart lines are booked for this person — the count the
   *  "booking for" chips show. */
  itemCount: number;
}

export interface CartResult {
  cartItems: ResolvedCartItem[];
  /** One entry per person the cart is booking for, in the order they first
   *  appear. Sent alongside the flat `cartItems` rather than nesting the
   *  items under each member, so the existing client — which reads
   *  `cartItems` as a flat list and knows nothing about members — keeps
   *  working untouched. */
  customers: CartCustomer[];
  walletBalance: number;
  couponApplied: { couponCode: string; discountAmount: number } | null;
  paymentSummary: {
    itemCount: number;
    /** Sum of every line's MRP (`Test/Package.price`) — the struck-through
     *  figure on each card, totalled. Additive field: `subtotal` still means
     *  what it always did (the sale-price total) so existing clients that
     *  only read `subtotal` are unaffected. */
    totalMrp: number;
    /** `totalMrp − subtotal` — what the sale prices already knock off MRP,
     *  before any coupon. */
    mrpDiscount: number;
    subtotal: number;
    walletDiscount: number;
    couponDiscount: number;
    totalPayable: number;
  };
  defaultAddress: { address_id: string; address: string } | null;
}

/** Names for the members the cart's lines point at — one lookup for the
 *  whole cart rather than one per line. A line whose member has since been
 *  deleted (`familyMemberId` nulled by the FK's SetNull) simply doesn't
 *  contribute a customer; checkout is what refuses that cart, not this. */
async function buildCartCustomers(items: ResolvedCartItem[]): Promise<CartCustomer[]> {
  const ids = [...new Set(items.map((i) => i.familyMemberId).filter((id): id is string => !!id))];
  if (ids.length === 0) return [];

  const members = await prisma.familyMember.findMany({
    where: { id: { in: ids } },
    include: { patient: true },
  });
  const memberById = new Map(members.map((m) => [m.id, m]));

  return ids.flatMap((id) => {
    const member = memberById.get(id);
    if (!member) return [];
    return [
      {
        familyMemberId: id,
        name: `${member.patient.firstName} ${member.patient.lastName}`.trim(),
        relation: toRelationLabel(member.relation),
        itemCount: items.filter((i) => i.familyMemberId === id).length,
      },
    ];
  });
}

export async function getCart(appUserId: string, platform: AppPlatform): Promise<CartResult> {
  const [cart, wallet, defaultAddress] = await Promise.all([
    prisma.cart.findUnique({ where: { appUserId }, include: { items: true, coupon: true } }),
    getOrCreateWallet(appUserId),
    prisma.address.findFirst({ where: { appUserId, isDefault: true } }),
  ]);

  const cartItems = cart ? await resolveCartItems(cart.items) : [];
  const subtotal = cartItems.reduce((sum, item) => sum + item.salePrice, 0);
  const totalMrp = cartItems.reduce((sum, item) => sum + item.mrp, 0);
  const customers = await buildCartCustomers(cartItems);

  let couponApplied: CartResult["couponApplied"] = null;
  let couponDiscount = 0;

  if (cart?.coupon) {
    const eligibility = await checkCouponEligibility(cart.coupon, subtotal, appUserId, platform);
    if (eligibility.valid) {
      couponApplied = { couponCode: cart.coupon.code, discountAmount: eligibility.discountAmount };
      couponDiscount = eligibility.discountAmount;
    } else {
      // Stale/no-longer-eligible coupon — silently dropped on fetch rather
      // than surfaced as an error (see api.md's Get Cart business logic).
      await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
    }
  }

  return {
    cartItems,
    customers,
    walletBalance: Number(wallet.balance),
    couponApplied,
    paymentSummary: {
      itemCount: cartItems.length,
      totalMrp,
      mrpDiscount: Math.max(totalMrp - subtotal, 0),
      subtotal,
      walletDiscount: 0,
      couponDiscount,
      totalPayable: Math.max(subtotal - couponDiscount, 0),
    },
    defaultAddress: defaultAddress
      ? { address_id: defaultAddress.id, address: defaultAddress.address }
      : null,
  };
}

export interface RemoveCartInput {
  cart_id?: string;
  type?: "1" | "3";
  type_id?: string;
  family_member_id?: string;
}

/** Same-request-shape convenience: a client can remove an item either by the
 *  cart line's own id (`cart_id`, returned by Get Cart/Review Cart), or by
 *  replaying the exact `{type, type_id, family_member_id}` it used to add
 *  the item — mirrors `addToCart`'s own default-to-self behavior, and is
 *  unambiguous because `CartItem` is unique on
 *  (cartId, itemType, itemId, familyMemberId). */
async function findCartItem(appUserId: string, input: RemoveCartInput) {
  if (input.cart_id) {
    const item = await prisma.cartItem.findUnique({
      where: { id: input.cart_id },
      include: { cart: true },
    });
    return item && item.cart.appUserId === appUserId ? item : null;
  }

  const itemType = input.type === "1" ? "PACKAGE" : "TEST";
  const familyMemberId = input.family_member_id || (await resolveSelfFamilyMemberId(appUserId));

  return prisma.cartItem.findFirst({
    where: { itemType, itemId: input.type_id, familyMemberId, cart: { appUserId } },
    include: { cart: true },
  });
}

export async function removeCartItem(
  appUserId: string,
  input: RemoveCartInput,
  platform: AppPlatform,
): Promise<void> {
  const item = await findCartItem(appUserId, input);
  if (!item) {
    throw ApiError.notFound("Cart item not found");
  }

  await prisma.cartItem.delete({ where: { id: item.id } });

  // Re-validate any applied coupon against the new (lower) subtotal.
  const cart = await prisma.cart.findUnique({
    where: { id: item.cartId },
    include: { items: true, coupon: true },
  });
  if (cart?.coupon) {
    const remainingItems = await resolveCartItems(cart.items);
    const subtotal = remainingItems.reduce((sum, i) => sum + i.salePrice, 0);
    const eligibility = await checkCouponEligibility(cart.coupon, subtotal, appUserId, platform);
    if (!eligibility.valid) {
      await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
    }
  }
}

export interface SetCartFamilyMemberInput {
  familyMemberId: string;
  /** One cart line to move, from Get Cart's `cartItems[].id`. Omit to move
   *  the WHOLE cart, which is the original behaviour. */
  cartId?: string;
}

/** Points cart lines at a family member.
 *
 *  With `cartId`, exactly one line moves — that's what makes a mixed cart
 *  possible ("CBC for Dad, Thyroid for Mum" in one order), and it's the call
 *  a per-item picker should make. Without it, every line collapses onto one
 *  member, which is the original whole-cart picker and stays supported: a
 *  client that only books for one person at a time keeps working unchanged.
 *
 *  Either way the (cartId, itemType, itemId, familyMemberId) unique index
 *  decides what a collision means: two lines that would become identical are
 *  merged by dropping one, never left to fail the request. */
export async function setCartFamilyMember(
  appUserId: string,
  input: SetCartFamilyMemberInput,
): Promise<void> {
  const { familyMemberId, cartId } = input;
  const member = await prisma.familyMember.findUnique({ where: { id: familyMemberId } });
  if (!member || member.appUserId !== appUserId) {
    throw ApiError.notFound("Family member not found");
  }

  const cart = await prisma.cart.findUnique({ where: { appUserId }, include: { items: true } });
  if (!cart || cart.items.length === 0) return;

  if (cartId) {
    const line = cart.items.find((item) => item.id === cartId);
    if (!line) {
      throw ApiError.notFound("Cart item not found");
    }
    if (line.familyMemberId === familyMemberId) return;

    // That person may already have this exact test/package in the cart. The
    // move would then duplicate it, so it becomes a merge: drop the line
    // being moved and leave the existing one standing.
    const duplicate = cart.items.find(
      (item) =>
        item.id !== line.id &&
        item.itemType === line.itemType &&
        item.itemId === line.itemId &&
        item.familyMemberId === familyMemberId,
    );

    if (duplicate) {
      await prisma.cartItem.delete({ where: { id: line.id } });
    } else {
      await prisma.cartItem.update({ where: { id: line.id }, data: { familyMemberId } });
    }
    return;
  }

  const seen = new Set<string>();
  const toKeep: string[] = [];
  const toDelete: string[] = [];
  for (const item of cart.items) {
    const key = `${item.itemType}:${item.itemId}`;
    if (seen.has(key)) {
      toDelete.push(item.id);
    } else {
      seen.add(key);
      toKeep.push(item.id);
    }
  }

  await prisma.$transaction([
    ...(toDelete.length ? [prisma.cartItem.deleteMany({ where: { id: { in: toDelete } } })] : []),
    prisma.cartItem.updateMany({ where: { id: { in: toKeep } }, data: { familyMemberId } }),
  ]);
}

export interface ApplyCouponResult {
  status: boolean;
  message: string;
}

export async function applyCoupon(
  appUserId: string,
  couponCode: string,
  platform: AppPlatform,
): Promise<ApplyCouponResult> {
  const cart = await prisma.cart.upsert({
    where: { appUserId },
    update: {},
    create: { appUserId },
    include: { items: true },
  });

  const coupon = await findCouponByCode(couponCode);
  if (!coupon) {
    return { status: false, message: "Invalid coupon code" };
  }

  const items = await resolveCartItems(cart.items);
  const subtotal = items.reduce((sum, i) => sum + i.salePrice, 0);

  const eligibility = await checkCouponEligibility(coupon, subtotal, appUserId, platform);
  if (!eligibility.valid) {
    return { status: false, message: eligibility.reason ?? "This coupon cannot be applied" };
  }

  // Re-applying replaces (not stacks) any previously applied coupon.
  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: coupon.id } });

  return { status: true, message: "Coupon applied successfully" };
}

/** Idempotent, per api.md's Remove Coupon spec: no cart, or a cart with no
 *  coupon, is a successful no-op rather than an error — a client retrying
 *  after a dropped response shouldn't be told it failed. Only the cart's
 *  coupon link is cleared; `CouponRedemption` rows are written at order
 *  finalization, not on apply, so there's nothing pending to undo. */
export async function removeCoupon(appUserId: string): Promise<void> {
  await prisma.cart.updateMany({ where: { appUserId }, data: { couponId: null } });
}

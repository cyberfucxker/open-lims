import { delay, newId } from "../delay";
import { MOCK_BANNERS, MOCK_CATEGORIES, MOCK_HOME_COUPONS } from "../data/categories";
import { MOCK_PACKAGES } from "../data/packages";
import { MOCK_TESTS } from "../data/tests";
import { mockDb } from "../state";
import type { AddToCartRequest, HomeResult, PackageCatalogItem, TestCatalogItem } from "@/types";

function isPackageInCart(packageId: string) {
  return mockDb.cartItems.some((c) => c.itemType === "PACKAGE" && c.itemId === packageId);
}

function isTestInCart(testId: string) {
  return mockDb.cartItems.some((c) => c.itemType === "TEST" && c.itemId === testId);
}

function toPackageCatalogItem(p: (typeof MOCK_PACKAGES)[number]): PackageCatalogItem {
  return {
    id: p.id,
    slug: p.slug,
    package_name: p.package_name,
    package_code: p.package_code,
    actual_price: p.actual_price,
    offer_price: p.offer_price,
    parameter_count: p.parameter_count,
    reporting_time: p.reporting_time,
    booked_count: p.booked_count,
    is_added_to_cart: isPackageInCart(p.id),
    includes: p.includes,
    tag: p.tag,
  };
}

function toTestCatalogItem(t: (typeof MOCK_TESTS)[number]): TestCatalogItem {
  return {
    id: t.id,
    slug: t.slug,
    test_name: t.test_name,
    test_code: t.test_code,
    price: t.price,
    offer_price: t.offer_price,
    parameter_count: t.parameter_count,
    reporting_time: t.reporting_time,
    booked_count: t.booked_count,
    is_added_to_cart: isTestInCart(t.id),
  };
}

export const catalogApi = {
  async getHome(): Promise<HomeResult> {
    return delay({
      app_banners: MOCK_BANNERS,
      home_banners: [],
      web_banners: [],
      categories: MOCK_CATEGORIES,
      packages: MOCK_PACKAGES.map(toPackageCatalogItem),
      tests: MOCK_TESTS.map(toTestCatalogItem),
      coupons: MOCK_HOME_COUPONS,
    });
  },

  async listTests(): Promise<TestCatalogItem[]> {
    return delay(MOCK_TESTS.map(toTestCatalogItem));
  },

  async listPackages(): Promise<PackageCatalogItem[]> {
    return delay(MOCK_PACKAGES.map(toPackageCatalogItem));
  },

  async getTestDetail(id: string) {
    const test = MOCK_TESTS.find((t) => t.id === id);
    if (!test) return delay(null);
    return delay({ ...test, is_added_to_cart: isTestInCart(test.id) });
  },

  async getPackageDetail(id: string) {
    const pkg = MOCK_PACKAGES.find((p) => p.id === id);
    if (!pkg) return delay(null);
    return delay({ ...pkg, is_added_to_cart: isPackageInCart(pkg.id) });
  },

  async addToCart(payload: AddToCartRequest): Promise<null> {
    const itemType = payload.type === "1" ? "PACKAGE" : "TEST";
    const familyMemberId = payload.family_member_id ?? "fm_self";
    const exists = mockDb.cartItems.some(
      (c) =>
        c.itemType === itemType &&
        c.itemId === payload.type_id &&
        c.familyMemberId === familyMemberId,
    );
    if (!exists) {
      mockDb.cartItems.push({
        id: newId("cart"),
        itemType,
        itemId: payload.type_id,
        familyMemberId,
      });
    }
    return delay(null, 250);
  },
};

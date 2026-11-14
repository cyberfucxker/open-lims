import { STOCK_IMAGES } from "@/assets/stock";
import type { CategoryItem } from "@/types";

export const MOCK_CATEGORIES: CategoryItem[] = [
  { id: "cat_fullbody", name: "Full Body", image: null, thumbnail: null },
  { id: "cat_diabetes", name: "Diabetes", image: null, thumbnail: null },
  { id: "cat_heart", name: "Heart", image: null, thumbnail: null },
  { id: "cat_hormone", name: "Thyroid & Hormone", image: null, thumbnail: null },
  { id: "cat_vitamin", name: "Vitamins", image: null, thumbnail: null },
  { id: "cat_liver", name: "Liver", image: null, thumbnail: null },
  { id: "cat_kidney", name: "Kidney", image: null, thumbnail: null },
  { id: "cat_blood", name: "Blood & Anaemia", image: null, thumbnail: null },
  { id: "cat_infection", name: "Fever & Infection", image: null, thumbnail: null },
];

export const MOCK_BANNERS = [
  { id: "banner_1", image: STOCK_IMAGES.labInterior },
  { id: "banner_2", image: STOCK_IMAGES.labAnalysts },
  { id: "banner_3", image: STOCK_IMAGES.nightLab },
];

export const MOCK_HOME_COUPONS = [
  {
    id: "coupon_new50",
    coupon_code: "NEW50",
    title: "Flat ₹50 off on your first booking",
    discount_type: "flat" as const,
    discount_value: 50,
    min_booking_amount: 300,
    applicable_on: "all" as const,
    valid_till: "2026-12-31",
  },
  {
    id: "coupon_health10",
    coupon_code: "HEALTH10",
    title: "10% off on Full Body Packages",
    discount_type: "percentage" as const,
    discount_value: 10,
    min_booking_amount: 999,
    applicable_on: "packages" as const,
    valid_till: "2026-09-30",
  },
];

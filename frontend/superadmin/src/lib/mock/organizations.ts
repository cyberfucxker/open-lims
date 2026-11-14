import type { UserAppOrganization } from "@/lib/types";
import { cities } from "./cities";
import { fullName, phone, pick, randBool, randInt } from "./generators";

const ORG_NAMES = [
  "Wellness Corp Solutions",
  "MediCare Alliance",
  "HealthFirst Corporate",
  "Sunrise Diagnostics Franchise",
  "CityCare Clinic Network",
  "PrimeHealth Partners",
  "Apex Corporate Wellness",
  "TrueLife Franchise Hub",
  "Metro Health Collective",
  "Evercare Clinics",
  "Wellspring Corporate",
  "NovaHealth Franchise",
];

const TYPES: UserAppOrganization["type"][] = ["corporate", "franchise", "clinic"];

export const organizations: UserAppOrganization[] = ORG_NAMES.map((name, i) => ({
  id: `org-${i + 1}`,
  name,
  type: pick(TYPES),
  city: pick(cities.filter((c) => c.active)).name,
  contactName: fullName(),
  contactPhone: phone(),
  activeLogin: randBool(0.75),
  orderCount: randInt(20, 1400),
  priceListName: pick([
    "Standard Retail",
    "Corporate Tier 1",
    "Corporate Tier 2",
    "Franchise Wholesale",
  ]),
  commissionPct: randInt(5, 22),
  settlementDue: randInt(0, 180000),
}));

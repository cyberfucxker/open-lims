import type { BookingSource, UserAppAddress, UserAppPatient, UserAppWalletTxn } from "@/lib/types";
import { areas, cities } from "./cities";
import {
  AVATAR_COLORS,
  daysAgoISO,
  fullName,
  phone,
  pick,
  pickMany,
  randBool,
  randInt,
} from "./generators";

const SOURCES: BookingSource[] = ["android", "android", "android", "ios", "ios", "web"];

function makeAddresses(city: string, count: number): UserAppAddress[] {
  const cityAreas = areas.filter((a) => a.name).map((a) => a.name);
  return Array.from({ length: count }, (_, i) => ({
    id: `addr-${city}-${i}-${randInt(1000, 9999)}`,
    label: i === 0 ? "Home" : i === 1 ? "Office" : "Other",
    line1: `${randInt(1, 400)}, ${pick(["Sunrise Apartments", "Green Park Society", "Silver Oak Residency", "Lake View Towers", "Maple Heights"])}`,
    area: pick(cityAreas),
    city,
    state: cities.find((c) => c.name === city)?.state ?? "",
    pincode: `${400000 + randInt(0, 9999)}`,
    isDefault: i === 0,
  }));
}

function makeWalletLedger(count: number): { ledger: UserAppWalletTxn[]; balance: number } {
  let balance = 0;
  const ledger: UserAppWalletTxn[] = [];
  for (let i = 0; i < count; i++) {
    const isCredit = randBool(0.45);
    const amount = isCredit ? randInt(100, 1000) : randInt(50, 600);
    balance += isCredit ? amount : -amount;
    balance = Math.max(balance, 0);
    ledger.push({
      id: `wtxn-${i}-${randInt(10000, 99999)}`,
      date: daysAgoISO(randInt(1, 200)),
      type: isCredit ? "credit" : "debit",
      amount,
      reason: isCredit
        ? pick(["Recharge bonus", "Referral cashback", "Wallet recharge", "Promo credit"])
        : pick(["Order payment", "Order payment", "Report add-on"]),
      orderId: isCredit ? undefined : `order-${randInt(1, 480)}`,
      balanceAfter: balance,
    });
  }
  return { ledger: ledger.reverse(), balance };
}

export const customers: UserAppPatient[] = Array.from({ length: 260 }, (_, i) => {
  const city = pick(cities.filter((c) => c.active)).name;
  const orderCount = randInt(0, 22);
  const { ledger, balance } = makeWalletLedger(randInt(0, 8));
  return {
    id: `cust-${i + 1}`,
    name: fullName(),
    phone: phone(),
    email: randBool(0.7) ? `user${i + 1}@mailbox.com` : undefined,
    avatarColor: pick(AVATAR_COLORS),
    source: pick(SOURCES),
    city,
    registeredOn: daysAgoISO(randInt(1, 720)),
    orderCount,
    lifetimeValue: orderCount * randInt(450, 1800),
    walletBalance: balance,
    active: randBool(0.92),
    addresses: makeAddresses(city, randInt(1, 3)),
    walletLedger: ledger,
  };
});

export const cityNames = pickMany(
  cities.map((c) => c.name),
  cities.length,
);

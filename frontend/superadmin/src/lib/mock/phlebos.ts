import type { UserAppPhlebo, PhleboStatus } from "@/lib/types";
import { cities, areas } from "./cities";
import {
  daysAgoISO,
  fullName,
  phone,
  pick,
  pickMany,
  randBool,
  randFloat,
  randInt,
} from "./generators";

const STATUS_POOL: PhleboStatus[] = [
  "active",
  "active",
  "active",
  "active",
  "on_leave",
  "inactive",
];

export const phlebos: UserAppPhlebo[] = Array.from({ length: 42 }, (_, i) => {
  const city = cities[i % cities.length];
  const cityAreas = areas.filter((a) => a.cityId === city.id).map((a) => a.name);
  const completedOrders = randInt(40, 1200);
  return {
    id: `phlebo-${i + 1}`,
    name: fullName(),
    phone: phone(),
    city: city.name,
    areas: pickMany(cityAreas.length ? cityAreas : [city.name], Math.min(3, cityAreas.length || 1)),
    status: pick(STATUS_POOL),
    rating: randFloat(3.6, 5, 1),
    todayAssigned: randInt(0, 14),
    totalEarnings: randInt(15000, 220000),
    onTimePct: randInt(78, 99),
    completedOrders,
    joinedOn: daysAgoISO(randInt(30, 900)),
    bankVerified: randBool(0.9),
    ratingTrend: Array.from({ length: 8 }, () => randFloat(3.8, 5, 1)),
  };
});

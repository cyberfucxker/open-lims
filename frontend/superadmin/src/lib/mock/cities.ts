import type { UserAppArea, UserAppCity } from "@/lib/types";
import { randBool, randInt } from "./generators";

const CITY_SEED: { name: string; state: string }[] = [
  { name: "Mumbai", state: "Maharashtra" },
  { name: "Delhi", state: "Delhi" },
  { name: "Bengaluru", state: "Karnataka" },
  { name: "Pune", state: "Maharashtra" },
  { name: "Hyderabad", state: "Telangana" },
  { name: "Ahmedabad", state: "Gujarat" },
  { name: "Chennai", state: "Tamil Nadu" },
  { name: "Kolkata", state: "West Bengal" },
  { name: "Jaipur", state: "Rajasthan" },
  { name: "Lucknow", state: "Uttar Pradesh" },
  { name: "Indore", state: "Madhya Pradesh" },
  { name: "Nashik", state: "Maharashtra" },
];

const AREA_NAMES = [
  "Andheri West",
  "Bandra East",
  "Powai",
  "Malad",
  "Koramangala",
  "Indiranagar",
  "Whitefield",
  "Dwarka",
  "Rohini",
  "Saket",
  "Kothrud",
  "Viman Nagar",
  "Banjara Hills",
  "Gachibowli",
  "Satellite",
  "Vastrapur",
  "Adyar",
  "Anna Nagar",
  "Salt Lake",
  "Park Street",
  "Vaishali Nagar",
  "Malviya Nagar",
  "Gomti Nagar",
  "Hazratganj",
];

export const cities: UserAppCity[] = CITY_SEED.map((c, i) => ({
  id: `city-${i + 1}`,
  name: c.name,
  state: c.state,
  active: i < 10,
  pincodeBased: true,
  areaCount: randInt(4, 9),
  orderCount: randInt(120, 3400),
  waitlistCount: i >= 10 ? randInt(30, 260) : randInt(0, 15),
}));

export const areas: UserAppArea[] = cities.flatMap((city, ci) =>
  Array.from({ length: city.areaCount }, (_, ai) => ({
    id: `area-${ci + 1}-${ai + 1}`,
    cityId: city.id,
    name: AREA_NAMES[(ci * 3 + ai) % AREA_NAMES.length],
    pincode: `${400000 + ci * 1000 + ai * 11}`,
    serviceable: city.active ? randBool(0.85) : false,
    assignedPhleboCount: city.active ? randInt(1, 12) : 0,
  })),
);

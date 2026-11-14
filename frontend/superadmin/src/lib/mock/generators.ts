// Small deterministic-ish helpers for building realistic mock datasets.

export function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

const rng = seededRandom(42);

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function pickMany<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

export function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randFloat(min: number, max: number, decimals = 1): number {
  const val = rng() * (max - min) + min;
  return Number(val.toFixed(decimals));
}

export function randBool(trueChance = 0.5): boolean {
  return rng() < trueChance;
}

export function daysAgoISO(days: number, hour = 9): string {
  const d = new Date("2026-07-23T09:00:00");
  d.setDate(d.getDate() - days);
  // Set the hour directly (not subtracted from the anchor) so `days` always
  // maps to the intended calendar day — subtracting could underflow into
  // the previous day and break "today" counts (e.g. Audit Log's stat card).
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function daysFromNowISO(days: number): string {
  const d = new Date("2026-07-23T09:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export const FIRST_NAMES = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Vihaan",
  "Arjun",
  "Sai",
  "Reyansh",
  "Krishna",
  "Ishaan",
  "Rohan",
  "Ananya",
  "Diya",
  "Aadhya",
  "Saanvi",
  "Myra",
  "Pari",
  "Anika",
  "Kavya",
  "Ira",
  "Riya",
  "Priya",
  "Neha",
  "Pooja",
  "Sneha",
  "Rahul",
  "Karan",
  "Amit",
  "Vikram",
  "Sanjay",
  "Rajesh",
  "Deepak",
  "Suresh",
  "Meera",
  "Kiran",
  "Sunita",
  "Anjali",
  "Rekha",
  "Lata",
  "Geeta",
  "Nisha",
];

export const LAST_NAMES = [
  "Sharma",
  "Verma",
  "Gupta",
  "Malhotra",
  "Kapoor",
  "Singh",
  "Reddy",
  "Rao",
  "Iyer",
  "Nair",
  "Menon",
  "Patel",
  "Shah",
  "Mehta",
  "Chopra",
  "Bhatia",
  "Joshi",
  "Desai",
  "Agarwal",
  "Bansal",
  "Saxena",
  "Tiwari",
  "Pandey",
  "Mishra",
];

export function fullName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

export function phone(): string {
  return `9${randInt(700000000, 999999999)}`;
}

export const AVATAR_COLORS = [
  "#0d9488",
  "#7c3aed",
  "#2563eb",
  "#e34980",
  "#16a34a",
  "#eda100",
  "#0891b2",
  "#9333ea",
];

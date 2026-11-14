import { MOCK_PATIENTS } from "@/data/mockPatients";
import { MOCK_TESTS } from "@/data/mockTests";
import type { DashboardSummary } from "@/types/dashboard";

const REFERRAL_NAMES = [
  "C/O Ocean Multispecialty",
  "Maruti Healthcare",
  "Bal Gopal Woman & Child",
  "Chandrasekhar Clinic",
  "Self",
  "Hitendra Vihol",
  "Amar Rajput",
  "Ghanshyam Multispecialty",
  "Zinkal Raval",
  "Abhishek Vadnagara",
];

function buildTopReferrals() {
  let seed = 66450;
  return REFERRAL_NAMES.map((name, i) => {
    const amount = Math.max(1800, Math.round(seed));
    seed *= 0.55 + (i % 3) * 0.05;
    return { id: `ref-${i}`, name, amount };
  });
}

function buildTopTests() {
  const counts = new Map<string, number>();
  MOCK_PATIENTS.forEach((p) => {
    p.tests.forEach((line) => {
      counts.set(line.testId, (counts.get(line.testId) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .map(([testId, count]) => {
      const test = MOCK_TESTS.find((t) => t.id === testId);
      return { id: testId, name: test?.name ?? "Test", count: count + 20 };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

const totalPaid = MOCK_PATIENTS.reduce((sum, p) => sum + p.paidAmount, 0) + 180000;
const totalDue = Math.round(totalPaid * 0.35);
const totalDiscount = Math.round(totalPaid * 0.012);
const topReferrals = buildTopReferrals();
const referralBusinessTotal = topReferrals.reduce((sum, r) => sum + r.amount, 0) + 45230;

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  range: { from: new Date().toISOString(), to: new Date().toISOString() },
  billing: {
    total: totalPaid + totalDue,
    collection: totalPaid,
    due: totalDue,
    discount: totalDiscount,
  },
  reports: {
    total: 1009,
    generated: 958,
    submitted: 892,
    pending: 51,
  },
  registration: {
    total: 181,
    paid: 115,
    pending: 66,
    discounted: 1,
  },
  b2b: {
    business: 0,
    collection: 0,
    due: 0,
  },
  topReferrals,
  referralBusinessTotal,
  paymentBreakdown: {
    cash: totalPaid * 0.56,
    online: totalPaid * 0.44,
  },
  topTests: buildTopTests(),
};

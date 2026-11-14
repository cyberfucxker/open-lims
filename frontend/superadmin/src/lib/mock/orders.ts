import type {
  BookingSource,
  OrderStatus,
  PaymentMode,
  PaymentStatus,
  UserAppOrder,
} from "@/lib/types";
import { customers } from "./customers";
import { phlebos } from "./phlebos";
import { packages, tests } from "./tests";
import { daysAgoISO, pick, pickMany, randBool, randInt } from "./generators";

const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "phlebo_assigned",
  "sample_collected",
  "processing",
  "report_ready",
  "delivered",
];

const SOURCES: BookingSource[] = ["android", "android", "android", "ios", "ios", "web"];
const PAYMENT_MODES: PaymentMode[] = ["online", "online", "cod", "wallet"];

function buildTimeline(status: OrderStatus, createdAt: string) {
  const idx = status === "cancelled" ? 1 : STATUS_FLOW.indexOf(status);
  const steps = status === "cancelled" ? ["pending", "cancelled"] : STATUS_FLOW.slice(0, idx + 1);
  const base = new Date(createdAt).getTime();
  return steps.map((s, i) => ({
    status: s as OrderStatus,
    at: new Date(base + i * 3 * 60 * 60 * 1000).toISOString(),
  }));
}

export const orders: UserAppOrder[] = Array.from({ length: 480 }, (_, i) => {
  const customer = pick(customers);
  const address: { city: string; line1: string } = customer.addresses.length
    ? pick(customer.addresses)
    : { city: customer.city, line1: "" };
  const usePackage = randBool(0.35);
  const items = usePackage
    ? pickMany(packages, 1).map((p) => ({
        id: p.id,
        name: p.name,
        shortName: p.name,
        type: "package" as const,
        price: p.price,
      }))
    : pickMany(tests, randInt(1, 4)).map((t) => ({
        id: t.id,
        name: t.name,
        shortName: t.shortName,
        type: "test" as const,
        price: t.price,
      }));
  const amount = items.reduce((s, it) => s + it.price, 0);
  const discount = randBool(0.3) ? Math.round(amount * 0.1) : 0;
  const createdAt = daysAgoISO(randInt(0, 60), randInt(0, 12));
  const roll = randInt(0, 99);
  const status: OrderStatus =
    roll < 6
      ? "cancelled"
      : roll < 10
        ? "pending"
        : roll < 16
          ? "confirmed"
          : roll < 22
            ? "phlebo_assigned"
            : roll < 30
              ? "sample_collected"
              : roll < 40
                ? "processing"
                : roll < 55
                  ? "report_ready"
                  : "delivered";
  const phlebo = status === "pending" || status === "confirmed" ? null : pick(phlebos);
  const paymentStatus: PaymentStatus =
    status === "cancelled"
      ? pick(["refunded", "failed"])
      : randBool(0.85)
        ? "paid"
        : pick(["pending", "partial"]);

  return {
    id: `order-${i + 1}`,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    serviceAddress: `${address.line1 ? address.line1 + ", " : ""}${customer.city}`,
    city: customer.city,
    items,
    amount,
    discount,
    paymentMode: pick(PAYMENT_MODES),
    paymentStatus,
    phleboId: phlebo?.id ?? null,
    phleboName: phlebo?.name ?? null,
    slotDate: daysAgoISO(randInt(-6, 3)).slice(0, 10),
    slotTime: pick([
      "06:00 - 08:00",
      "08:00 - 10:00",
      "10:00 - 12:00",
      "16:00 - 18:00",
      "18:00 - 20:00",
    ]),
    status,
    source: pick(SOURCES),
    urgent: randBool(0.08),
    createdAt,
    timeline: buildTimeline(status, createdAt),
  };
});

// Reconcile each customer's stored orderCount/lifetimeValue against the orders
// actually generated for them above — both were built independently, so
// without this pass a customer's profile stats wouldn't match their own
// order history tab.
const ordersByCustomer = new Map<string, UserAppOrder[]>();
orders.forEach((o) => {
  const list = ordersByCustomer.get(o.customerId) ?? [];
  list.push(o);
  ordersByCustomer.set(o.customerId, list);
});
customers.forEach((c) => {
  const customerOrders = ordersByCustomer.get(c.id) ?? [];
  c.orderCount = customerOrders.filter((o) => o.status !== "cancelled").length;
  c.lifetimeValue = customerOrders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + (o.amount - o.discount), 0);
});

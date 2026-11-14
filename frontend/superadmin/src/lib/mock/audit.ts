import type { UserAppAuditLogEntry, UserAppExportLog, UserAppReportDelivery } from "@/lib/types";
import { orders } from "./orders";
import { daysAgoISO, pick, randInt } from "./generators";

const ACTORS = [
  "Admin - Priya Sharma",
  "Admin - Rohit Mehta",
  "Superadmin - Root",
  "Ops - Kavya Nair",
  "Finance - Sanjay Rao",
];
const ACTIONS = [
  { action: "Reassigned phlebotomist", module: "Order Management" },
  { action: "Edited order items", module: "Order Management" },
  { action: "Issued manual refund", module: "Payments & Transactions" },
  { action: "Blocked slot", module: "Slot Management" },
  { action: "Updated test price", module: "Test & Package Management" },
  { action: "Blocked customer account", module: "Customer Management" },
  { action: "Credited wallet manually", module: "Wallet Management" },
  { action: "Published CMS page", module: "CMS Pages" },
  { action: "Approved WhatsApp template", module: "Notifications" },
  { action: "Updated force-update version", module: "Settings" },
];

export const auditLog: UserAppAuditLogEntry[] = Array.from({ length: 140 }, (_, i) => {
  const entry = pick(ACTIONS);
  return {
    id: `audit-${i + 1}`,
    actor: pick(ACTORS),
    action: entry.action,
    target: pick(orders).id,
    module: entry.module,
    at: daysAgoISO(randInt(0, 90), randInt(0, 23)),
    ip: `10.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`,
  };
});

export const reportDeliveries: UserAppReportDelivery[] = orders
  .filter((o) => ["processing", "report_ready", "delivered"].includes(o.status))
  .map((o, i) => {
    const collectedEvent = o.timeline.find((t) => t.status === "sample_collected");
    const collectedAt = collectedEvent?.at ?? o.createdAt;
    const tatHours = o.items[0]?.type === "package" ? 24 : 8;
    const dueAt = new Date(new Date(collectedAt).getTime() + tatHours * 3600 * 1000).toISOString();
    const slaBreached =
      o.status !== "delivered" &&
      new Date(dueAt).getTime() < new Date("2026-07-23T09:00:00").getTime();
    const status: UserAppReportDelivery["status"] =
      o.status === "processing"
        ? "not_uploaded"
        : o.status === "report_ready"
          ? "uploaded"
          : "downloaded";
    return {
      id: `report-${i + 1}`,
      orderId: o.id,
      customerName: o.customerName,
      testName: o.items.map((it) => it.shortName).join(", "),
      status,
      tatHours,
      slaBreached,
      collectedAt,
      dueAt,
    };
  });

export const exportLogs: UserAppExportLog[] = [
  {
    id: "export-1",
    module: "Customer Management",
    fileName: "customers_export_20260718.xlsx",
    format: "xlsx",
    requestedBy: "Priya Sharma",
    requestedAt: daysAgoISO(5),
    rows: 260,
  },
  {
    id: "export-2",
    module: "Order Management",
    fileName: "orders_july_2026.csv",
    format: "csv",
    requestedBy: "Rohit Mehta",
    requestedAt: daysAgoISO(3),
    rows: 480,
  },
  {
    id: "export-3",
    module: "Payments & Transactions",
    fileName: "payments_reconciliation.xlsx",
    format: "xlsx",
    requestedBy: "Sanjay Rao",
    requestedAt: daysAgoISO(1),
    rows: 412,
  },
  {
    id: "export-4",
    module: "Phlebotomist Management",
    fileName: "phlebo_payouts_june.pdf",
    format: "pdf",
    requestedBy: "Kavya Nair",
    requestedAt: daysAgoISO(20),
    rows: 42,
  },
  {
    id: "export-5",
    module: "Wallet Management",
    fileName: "wallet_ledger_export.csv",
    format: "csv",
    requestedBy: "Priya Sharma",
    requestedAt: daysAgoISO(9),
    rows: 890,
  },
  {
    id: "export-6",
    module: "Reports Delivery Tracker",
    fileName: "sla_breach_report.xlsx",
    format: "xlsx",
    requestedBy: "Rohit Mehta",
    requestedAt: daysAgoISO(2),
    rows: 34,
  },
];

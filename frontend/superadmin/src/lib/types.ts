// Shared domain types for the Open LIMS Superadmin panel.
// Naming mirrors the eventual Prisma/API entity names (userApp* prefix) so
// swapping mock data for real `/user/*` API responses later is a low-diff change.

export type BookingSource = "android" | "ios" | "web";
export type PaymentMode = "online" | "cod" | "wallet";
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded" | "partial";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "phlebo_assigned"
  | "sample_collected"
  | "processing"
  | "report_ready"
  | "delivered"
  | "cancelled";

export interface UserAppAddress {
  id: string;
  label: string;
  line1: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface UserAppWalletTxn {
  id: string;
  date: string;
  type: "credit" | "debit";
  amount: number;
  reason: string;
  orderId?: string;
  balanceAfter: number;
}

export interface UserAppPatient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarColor: string;
  source: BookingSource;
  city: string;
  registeredOn: string;
  orderCount: number;
  lifetimeValue: number;
  walletBalance: number;
  active: boolean;
  addresses: UserAppAddress[];
  walletLedger: UserAppWalletTxn[];
}

export interface UserAppTestItem {
  id: string;
  name: string;
  shortName: string;
  type: "test" | "package";
  price: number;
}

export interface UserAppOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceAddress: string;
  city: string;
  items: UserAppTestItem[];
  amount: number;
  discount: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  phleboId: string | null;
  phleboName: string | null;
  slotDate: string;
  slotTime: string;
  status: OrderStatus;
  source: BookingSource;
  urgent: boolean;
  createdAt: string;
  timeline: { status: OrderStatus; at: string; note?: string }[];
}

export interface UserAppParameter {
  id: string;
  name: string;
  unit: string;
  method: string;
  normalRange: { group: string; range: string }[];
}

export interface UserAppTest {
  id: string;
  name: string;
  shortName: string;
  price: number;
  sampleType: string;
  tatHours: number;
  department: string;
  parameterIds: string[];
  active: boolean;
  orderCount: number;
}

export interface UserAppPackage {
  id: string;
  name: string;
  testIds: string[];
  price: number;
  sumOfTests: number;
  description: string;
  active: boolean;
  orderCount: number;
}

export type PhleboStatus = "active" | "on_leave" | "inactive";

export interface UserAppPhlebo {
  id: string;
  name: string;
  phone: string;
  city: string;
  areas: string[];
  status: PhleboStatus;
  rating: number;
  todayAssigned: number;
  totalEarnings: number;
  onTimePct: number;
  completedOrders: number;
  joinedOn: string;
  bankVerified: boolean;
  ratingTrend: number[];
}

export interface UserAppOrganization {
  id: string;
  name: string;
  type: "corporate" | "franchise" | "clinic";
  city: string;
  contactName: string;
  contactPhone: string;
  activeLogin: boolean;
  orderCount: number;
  priceListName: string;
  commissionPct: number;
  settlementDue: number;
}

export interface UserAppCity {
  id: string;
  name: string;
  state: string;
  active: boolean;
  pincodeBased: boolean;
  areaCount: number;
  orderCount: number;
  waitlistCount: number;
}

export interface UserAppArea {
  id: string;
  cityId: string;
  name: string;
  pincode: string;
  serviceable: boolean;
  assignedPhleboCount: number;
}

export interface UserAppSlotBucket {
  id: string;
  label: string;
  start: string;
  end: string;
  capacity: number;
  booked: number;
}

export interface UserAppSlotDay {
  date: string;
  cityId: string;
  status: "available" | "partial" | "full" | "blocked";
  buckets: UserAppSlotBucket[];
}

export type NotificationChannel = "push" | "sms" | "whatsapp" | "email";
export type TemplateCategory =
  | "order_confirmation"
  | "phlebo_assigned"
  | "sample_collected"
  | "report_ready"
  | "payment_reminder"
  | "wallet_recharge"
  | "promotional";
export type TemplateApproval = "pending" | "approved" | "rejected";

export interface UserAppNotificationTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  channel: NotificationChannel;
  body: string;
  variables: string[];
  approval: TemplateApproval;
  updatedAt: string;
}

export interface UserAppNotificationCampaign {
  id: string;
  name: string;
  templateId: string;
  channel: NotificationChannel;
  audience: string;
  sentAt: string;
  stats: { sent: number; delivered: number; read: number; failed: number };
}

export interface UserAppPayment {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  mode: PaymentMode;
  status: PaymentStatus;
  gatewayRef: string;
  createdAt: string;
}

export interface UserAppReview {
  id: string;
  customerName: string;
  targetType: "app" | "phlebo";
  targetName?: string;
  rating: number;
  comment: string;
  createdAt: string;
  flagged: boolean;
}

export interface UserAppAuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  module: string;
  at: string;
  ip: string;
}

export interface UserAppReportDelivery {
  id: string;
  orderId: string;
  customerName: string;
  testName: string;
  status: "not_uploaded" | "uploaded" | "downloaded";
  tatHours: number;
  slaBreached: boolean;
  collectedAt: string;
  dueAt: string;
}

export interface UserAppExportLog {
  id: string;
  module: string;
  fileName: string;
  format: "xlsx" | "csv" | "pdf";
  requestedBy: string;
  requestedAt: string;
  rows: number;
}

export type DashboardPeriod = "today" | "week" | "month" | "all";

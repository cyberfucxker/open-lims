import type {
  NotificationChannel,
  TemplateApproval,
  TemplateCategory,
  UserAppNotificationCampaign,
  UserAppNotificationTemplate,
} from "@/lib/types";
import { daysAgoISO, pick, randInt } from "./generators";

const TEMPLATE_SEED: {
  name: string;
  category: TemplateCategory;
  channel: NotificationChannel;
  body: string;
  variables: string[];
  approval: TemplateApproval;
}[] = [
  {
    name: "Order Confirmed",
    category: "order_confirmation",
    channel: "whatsapp",
    body: "Hi {customer_name}, your order {order_id} has been confirmed. Our phlebotomist will visit you on {slot_date} at {slot_time}. Track your order anytime in the Example Lab app.",
    variables: ["customer_name", "order_id", "slot_date", "slot_time"],
    approval: "approved",
  },
  {
    name: "Phlebo On The Way",
    category: "phlebo_assigned",
    channel: "whatsapp",
    body: "Hi {customer_name}, {phlebo_name} has been assigned for your sample collection ({order_id}) and will reach you shortly. Please keep your ID proof ready.",
    variables: ["customer_name", "phlebo_name", "order_id"],
    approval: "approved",
  },
  {
    name: "Sample Collected",
    category: "sample_collected",
    channel: "whatsapp",
    body: "Hi {customer_name}, your sample for order {order_id} has been collected successfully. Your report will be ready within the estimated TAT.",
    variables: ["customer_name", "order_id"],
    approval: "approved",
  },
  {
    name: "Report Ready",
    category: "report_ready",
    channel: "whatsapp",
    body: "Hi {customer_name}, your report for order {order_id} is ready. Download it here: {report_link}",
    variables: ["customer_name", "order_id", "report_link"],
    approval: "approved",
  },
  {
    name: "Payment Reminder",
    category: "payment_reminder",
    channel: "sms",
    body: "Dear {customer_name}, payment of Rs.{amount} is pending for order {order_id}. Pay now to avoid delay in report delivery.",
    variables: ["customer_name", "amount", "order_id"],
    approval: "approved",
  },
  {
    name: "Wallet Recharge Success",
    category: "wallet_recharge",
    channel: "push",
    body: "Rs.{amount} has been added to your wallet. New balance: Rs.{balance}.",
    variables: ["amount", "balance"],
    approval: "approved",
  },
  {
    name: "Monsoon Health Checkup Offer",
    category: "promotional",
    channel: "whatsapp",
    body: "Hi {customer_name}, get flat 20% off on Full Body Checkup packages this monsoon. Use code MONSOON20. Valid till {valid_till}.",
    variables: ["customer_name", "valid_till"],
    approval: "pending",
  },
  {
    name: "Report Delay Apology",
    category: "report_ready",
    channel: "sms",
    body: "Dear {customer_name}, we regret the delay in your report for order {order_id}. It will be delivered within 2 hours.",
    variables: ["customer_name", "order_id"],
    approval: "rejected",
  },
  {
    name: "Diabetes Package Promo",
    category: "promotional",
    channel: "push",
    body: "Manage your diabetes better. Book the Diabetes Care Package at Rs.999 only, valid till {valid_till}.",
    variables: ["valid_till"],
    approval: "approved",
  },
];

export const notificationTemplates: UserAppNotificationTemplate[] = TEMPLATE_SEED.map((t, i) => ({
  id: `tmpl-${i + 1}`,
  ...t,
  updatedAt: daysAgoISO(randInt(1, 60)),
}));

const CAMPAIGN_NAMES = [
  "Monsoon Health Checkup Blast",
  "Weekend Wallet Cashback",
  "Diabetes Package Push",
  "Report Ready Reminder Batch",
  "Payment Pending Nudge",
  "New City Launch - Nashik",
  "Full Body Checkup Flash Sale",
  "Loyalty Reward Announcement",
];

export const notificationCampaigns: UserAppNotificationCampaign[] = CAMPAIGN_NAMES.map(
  (name, i) => {
    const sent = randInt(2000, 45000);
    const delivered = Math.round(sent * (randInt(85, 98) / 100));
    const read = Math.round(delivered * (randInt(40, 85) / 100));
    const failed = sent - delivered;
    return {
      id: `camp-${i + 1}`,
      name,
      templateId: pick(notificationTemplates).id,
      channel: pick(["whatsapp", "push", "sms", "email"]),
      audience: pick([
        "All customers",
        "Mumbai + Pune",
        "Filtered: 5+ orders",
        "Filtered: wallet < 100",
        "Uploaded CSV list",
      ]),
      sentAt: daysAgoISO(randInt(0, 45)),
      stats: { sent, delivered, read, failed },
    };
  },
);

import { Bell, Mail, MessageCircle, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { NotificationChannel, TemplateCategory } from "@/lib/types";

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "order_confirmation",
  "phlebo_assigned",
  "sample_collected",
  "report_ready",
  "payment_reminder",
  "wallet_recharge",
  "promotional",
];

export const NOTIFICATION_CHANNELS: NotificationChannel[] = ["push", "sms", "whatsapp", "email"];

export const INSERT_VARIABLES = [
  "customer_name",
  "order_id",
  "phlebo_name",
  "report_link",
  "amount",
  "balance",
  "valid_till",
];

export function categoryLabel(category: TemplateCategory): string {
  return category
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function channelLabel(channel: NotificationChannel): string {
  switch (channel) {
    case "push":
      return "Push";
    case "sms":
      return "SMS";
    case "whatsapp":
      return "WhatsApp";
    case "email":
      return "Email";
  }
}

export const CHANNEL_ICONS: Record<NotificationChannel, LucideIcon> = {
  push: Bell,
  sms: MessageSquare,
  whatsapp: MessageCircle,
  email: Mail,
};

export const CHANNEL_TONE_CLASSES: Record<NotificationChannel, string> = {
  push: "bg-brand-violet/10 text-brand-violet",
  sms: "bg-info/10 text-info",
  whatsapp: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  email: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function extractVariables(body: string): string[] {
  const matches = body.match(/\{[a-zA-Z0-9_]+\}/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(1, -1))));
}

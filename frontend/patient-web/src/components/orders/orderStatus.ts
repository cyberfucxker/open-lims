import {
  Ban,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  Hourglass,
  MapPin,
  Navigation,
  TestTube2,
  UserCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { ORDER_STATUS_LABEL, ORDER_STATUS_TIMELINE } from "@/types";
import type { AppOrderStatus } from "@/types";
import type { BadgeProps } from "@/components/ui/badge";

/** The mock (and real) API only ever returns the human label string (e.g. "Sample
 *  Collected") on order records, never the raw `AppOrderStatus` key. This maps a label
 *  back to its enum key so we can look up timeline position / badge color / etc. */
export function getOrderStatusKey(label: string): AppOrderStatus | undefined {
  return (Object.keys(ORDER_STATUS_LABEL) as AppOrderStatus[]).find(
    (key) => ORDER_STATUS_LABEL[key] === label,
  );
}

export function getOrderStatusBadgeVariant(label: string): NonNullable<BadgeProps["variant"]> {
  const key = getOrderStatusKey(label);
  switch (key) {
    case "COMPLETED":
      return "success";
    case "CANCELLED":
    case "REJECTED":
      return "destructive";
    case "PENDING":
      return "warning";
    default:
      return "info";
  }
}

/** Semantic buckets a booking status can fall into. Deliberately mapped onto the same
 *  four hues the Badge variants already use (emerald / amber / sky / destructive) so
 *  status colour means the same thing everywhere in the app. */
export type OrderStatusTone = "success" | "danger" | "warning" | "active" | "neutral";

interface OrderStatusMeta {
  tone: OrderStatusTone;
  icon: LucideIcon;
  /** Plain-language restatement of the status, shown beside the pill on list cards. */
  hint: string;
}

const STATUS_META: Record<AppOrderStatus, OrderStatusMeta> = {
  PENDING: { tone: "warning", icon: Hourglass, hint: "Awaiting confirmation" },
  CONFIRMED: { tone: "active", icon: CalendarCheck, hint: "Slot confirmed" },
  ACCEPTED: { tone: "active", icon: UserCheck, hint: "Phlebotomist assigned" },
  STARTED_JOURNEY: { tone: "active", icon: Navigation, hint: "On the way to you" },
  REACHED: { tone: "active", icon: MapPin, hint: "Arrived at your address" },
  SAMPLE_COLLECTED: { tone: "active", icon: TestTube2, hint: "Sample in transit" },
  SAMPLE_DROPPED: { tone: "active", icon: FlaskConical, hint: "Processing at the lab" },
  COMPLETED: { tone: "success", icon: CheckCircle2, hint: "Reports ready" },
  REJECTED: { tone: "danger", icon: Ban, hint: "Could not be processed" },
  CANCELLED: { tone: "danger", icon: XCircle, hint: "Booking cancelled" },
};

const UNKNOWN_STATUS_META: OrderStatusMeta = { tone: "neutral", icon: ClipboardList, hint: "" };

export interface OrderStatusPresentation {
  key: AppOrderStatus | undefined;
  label: string;
  tone: OrderStatusTone;
  icon: LucideIcon;
  hint: string;
  /** 1-based position on the fulfilment track; null for statuses that sit off it. */
  step: number | null;
  totalSteps: number;
  /** True once the booking can no longer progress (completed / cancelled / rejected). */
  isTerminal: boolean;
}

/** Single lookup for everything a status needs to render — icon, colour bucket, copy and
 *  its position on the collection track — resolved from the human label the API returns. */
export function getOrderStatusPresentation(label: string): OrderStatusPresentation {
  const key = getOrderStatusKey(label);
  const meta = key ? STATUS_META[key] : UNKNOWN_STATUS_META;
  const index = key ? ORDER_STATUS_TIMELINE.indexOf(key) : -1;

  return {
    key,
    label,
    tone: meta.tone,
    icon: meta.icon,
    hint: meta.hint,
    step: index >= 0 ? index + 1 : null,
    totalSteps: ORDER_STATUS_TIMELINE.length,
    isTerminal: key === "COMPLETED" || key === "CANCELLED" || key === "REJECTED",
  };
}

/** Tone → Tailwind classes for each surface a status paints on a booking card. */
export const ORDER_STATUS_TONE: Record<
  OrderStatusTone,
  { strip: string; rail: string; medallion: string; pill: string; dot: string; fill: string }
> = {
  active: {
    strip: "bg-sky-500/[0.06]",
    rail: "bg-gradient-to-b from-sky-400 to-sky-600",
    medallion: "bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 dark:text-sky-400",
    pill: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
    fill: "bg-sky-500",
  },
  success: {
    strip: "bg-emerald-500/[0.06]",
    rail: "bg-gradient-to-b from-emerald-400 to-emerald-600",
    medallion:
      "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400",
    pill: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    fill: "bg-emerald-500",
  },
  warning: {
    strip: "bg-amber-500/[0.07]",
    rail: "bg-gradient-to-b from-amber-400 to-amber-600",
    medallion: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400",
    pill: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    fill: "bg-amber-500",
  },
  danger: {
    strip: "bg-destructive/[0.05]",
    rail: "bg-gradient-to-b from-destructive/60 to-destructive",
    medallion: "bg-destructive/10 text-destructive ring-1 ring-destructive/20",
    pill: "border-destructive/20 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
    fill: "bg-destructive",
  },
  neutral: {
    strip: "bg-muted/40",
    rail: "bg-gradient-to-b from-border to-muted-foreground/40",
    medallion: "bg-muted text-muted-foreground ring-1 ring-border",
    pill: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
    fill: "bg-muted-foreground",
  },
};

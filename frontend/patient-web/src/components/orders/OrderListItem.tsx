import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Banknote, CalendarDays, ChevronRight, Clock3, CreditCard, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";
import { formatBookingDate, formatBookingDayLabel, formatRupees } from "@/utils/format";
import type { OrderListItem as OrderListItemType } from "@/types";

import { OrderProgressTrack } from "./OrderProgressTrack";
import { OrderStatusPill } from "./OrderStatusPill";
import { ORDER_STATUS_TONE, getOrderStatusPresentation } from "./orderStatus";

interface OrderListItemProps {
  order: OrderListItemType;
  index?: number;
}

function MetaChip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
      {icon}
      {children}
    </span>
  );
}

function OrderListItem({ order, index = 0 }: OrderListItemProps) {
  const navigate = useNavigate();
  const reduceMotion = usePrefersReducedMotion();

  const status = getOrderStatusPresentation(order.orderStatus);
  const tone = ORDER_STATUS_TONE[status.tone];
  const StatusIcon = status.icon;
  const PaymentIcon = order.paymentMode === "Cash" ? Banknote : CreditCard;
  const dayLabel = formatBookingDayLabel(order.bookingDate);

  const open = () => navigate(`/orders/${order.id}`);

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`Booking ${order.orderNo} for ${order.patientName} — ${status.label}`}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm outline-none transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-xl hover:shadow-black/[0.06] focus-visible:ring-4 focus-visible:ring-ring active:translate-y-0"
      >
        <span aria-hidden className={cn("absolute inset-y-0 left-0 w-[3px]", tone.rail)} />

        <div
          className={cn(
            "flex items-center gap-3 border-b border-border/70 py-3 pr-4 pl-5",
            tone.strip,
          )}
        >
          <span
            aria-hidden
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              tone.medallion,
            )}
          >
            <StatusIcon className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <OrderStatusPill label={status.label} tone={status.tone} pulse={!status.isTerminal} />
            {status.hint && (
              <p className="mt-1 truncate text-xs text-muted-foreground">{status.hint}</p>
            )}
          </div>
          {dayLabel && (
            <span className="shrink-0 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur-sm">
              {dayLabel}
            </span>
          )}
        </div>

        <div className="space-y-3.5 py-4 pr-4 pl-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/15"
              >
                {order.patientName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] leading-snug font-semibold">
                  {order.patientName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {order.age}y · {order.gender}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[17px] leading-tight font-bold tabular-nums">
                {formatRupees(order.bookingAmount)}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <PaymentIcon className="size-3" />
                {order.paymentMode}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MetaChip icon={<CalendarDays className="size-3.5" />}>
              {formatBookingDate(order.bookingDate)}
            </MetaChip>
            {order.timeSlot && (
              <MetaChip icon={<Clock3 className="size-3.5" />}>{order.timeSlot}</MetaChip>
            )}
            {order.servicePin && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary">
                <KeyRound className="size-3.5" />
                PIN <span className="font-mono tracking-[0.15em]">{order.servicePin}</span>
              </span>
            )}
          </div>

          {status.step !== null && !status.isTerminal && (
            <OrderProgressTrack
              step={status.step}
              totalSteps={status.totalSteps}
              fillClass={tone.fill}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/70 bg-muted/30 py-2.5 pr-4 pl-5">
          <span className="font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
            #{order.orderNo}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            View details
            <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

export { OrderListItem };

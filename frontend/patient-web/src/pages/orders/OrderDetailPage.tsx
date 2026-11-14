import { useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Banknote,
  CalendarDays,
  ChevronLeft,
  Clock3,
  CreditCard,
  Download,
  FlaskConical,
  MapPin,
  Package as PackageIcon,
  Phone,
  SearchX,
  ShieldCheck,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrderDetailSkeleton } from "@/components/orders/OrderDetailSkeleton";
import { OrderStatusPill } from "@/components/orders/OrderStatusPill";
import { OrderStatusTimeline } from "@/components/orders/OrderStatusTimeline";
import { ServicePinCard } from "@/components/orders/ServicePinCard";
import { ORDER_STATUS_TONE, getOrderStatusPresentation } from "@/components/orders/orderStatus";
import { useCancelOrder, useOrderDetail } from "@/hooks/queries/useOrders";
import { cn } from "@/utils/cn";
import { formatBookingDate, formatBookingDayLabel, formatRupees } from "@/utils/format";
import { EASE_OUT_EXPO } from "@/utils/motion";

function BackBar({ title }: { title?: string }) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md md:top-[var(--top-nav-height)]">
      <div className="mx-auto flex h-13 max-w-5xl items-center gap-2 px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeft className="size-5" />
        </Button>
        <span className="truncate font-mono text-xs font-semibold tracking-wider text-muted-foreground">
          {title ?? "Booking"}
        </span>
      </div>
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  action,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card shadow-sm", className)}>
      <div className="flex items-center gap-2.5 border-b border-border/70 px-5 py-3.5">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        >
          <Icon className="size-4" />
        </span>
        <h2 className="flex-1 text-sm font-bold tracking-tight">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function MetaChip({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/70 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
      <Icon className="size-3.5 shrink-0" />
      {children}
    </span>
  );
}

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: order, isLoading } = useOrderDetail(id);
  const cancelMutation = useCancelOrder(id);

  if (isLoading) {
    return (
      <div className="pb-10">
        <BackBar />
        <OrderDetailSkeleton />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pb-10">
        <BackBar />
        <EmptyState
          icon={SearchX}
          title="Booking not found"
          description="This booking may have been removed or the link is no longer valid."
        />
      </div>
    );
  }

  const status = getOrderStatusPresentation(order.orderStatus);
  const tone = ORDER_STATUS_TONE[status.tone];
  const StatusIcon = status.icon;
  const PaymentIcon = order.payment.paymentMode === "Cash" ? Banknote : CreditCard;
  const dayLabel = formatBookingDayLabel(order.bookingDate);
  const canCancel = !status.isTerminal;

  return (
    <div className="pb-10">
      <BackBar title={`#${order.orderNo}`} />

      <header className="relative overflow-hidden border-b border-border bg-gradient-to-br from-accent/40 via-background to-background">
        <div
          aria-hidden
          className="absolute -top-32 right-0 size-80 rounded-full bg-primary/[0.06] blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="relative mx-auto max-w-5xl px-4 pt-6 pb-6"
        >
          <div className="flex items-start gap-3.5">
            <span
              aria-hidden
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                tone.medallion,
              )}
            >
              <StatusIcon className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                Booking #{order.orderNo}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
                {status.label}
              </h1>
              {status.hint && <p className="mt-0.5 text-sm text-muted-foreground">{status.hint}</p>}
            </div>
            <OrderStatusPill
              label={status.label}
              tone={status.tone}
              pulse={!status.isTerminal}
              className="hidden shrink-0 sm:inline-flex"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <MetaChip icon={CalendarDays}>{formatBookingDate(order.bookingDate)}</MetaChip>
            {order.timeSlot && <MetaChip icon={Clock3}>{order.timeSlot}</MetaChip>}
            <MetaChip icon={PaymentIcon}>{order.payment.paymentMode}</MetaChip>
            {dayLabel && (
              <span className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary">
                {dayLabel}
              </span>
            )}
          </div>
        </motion.div>
      </header>

      <div className="mx-auto max-w-5xl space-y-4 px-4 pt-5">
        {order.servicePin && <ServicePinCard pin={order.servicePin} />}

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
          <div className="space-y-4">
            <Panel icon={FlaskConical} title="Collection status">
              <OrderStatusTimeline status={order.orderStatus} />
            </Panel>

            {order.orderType === "HOME_VISIT" && order.items.length === 0 ? (
              <Panel icon={Stethoscope} title="What you told us">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {order.symptomNotes}
                </p>
                <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  Your phlebotomist will decide the right tests after examining you at the visit —
                  the final list and amount will show up here once that's done.
                </p>
              </Panel>
            ) : (
              <Panel icon={PackageIcon} title={`Tests & packages (${order.items.length})`}>
                <div className="space-y-3">
                  {order.items.map((item, i) => (
                    <div key={item.id}>
                      {i > 0 && <Separator className="mb-3" />}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{item.name}</p>
                          <span className="mt-1 inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                            {item.type}
                          </span>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums">
                          {formatRupees(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {order.patients.length > 0 ? (
              <Panel icon={Users} title={`Patient${order.patients.length > 1 ? "s" : ""}`}>
                <div className="space-y-3">
                  {order.patients.map((patient, i) => (
                    <div key={`${patient.name}-${i}`} className="flex items-center gap-3">
                      <Avatar className="size-10 ring-1 ring-border">
                        <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                          {patient.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{patient.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {patient.age}y · {patient.gender} ·{" "}
                          <span className="tabular-nums">{patient.mobile}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : (
              order.homeVisitPatient && (
                <Panel icon={Users} title="Patient">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 ring-1 ring-border">
                      <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                        {order.homeVisitPatient.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {order.homeVisitPatient.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.homeVisitPatient.relation}
                      </p>
                    </div>
                  </div>
                </Panel>
              )
            )}

            {order.address && (
              <Panel icon={MapPin} title="Collection address">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {order.address.address}, {order.address.city}, {order.address.state} —{" "}
                  <span className="tabular-nums">{order.address.pincode}</span>
                </p>
              </Panel>
            )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-[calc(var(--top-nav-height)+4.25rem)]">
            <Panel icon={PaymentIcon} title="Payment">
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Mode</dt>
                  <dd className="font-medium">{order.payment.paymentMode}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        order.payment.paymentStatus === "Paid"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : order.payment.paymentStatus === "Partial"
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            : "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      {order.payment.paymentStatus}
                    </span>
                  </dd>
                </div>
                <Separator />
                {/* Deliberately no items-subtotal row: this endpoint returns only the final
                    charged amount, not the phlebotomy/coupon/wallet breakdown, so a subtotal
                    would imply arithmetic the payload can't back up. */}
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="font-semibold">
                    {order.payment.paymentStatus === "Paid" ? "Total paid" : "Total payable"}
                  </dt>
                  <dd className="text-xl font-bold tabular-nums">
                    {formatRupees(order.payment.amount)}
                  </dd>
                </div>
              </dl>
            </Panel>

            {order.phlebotomist && (
              <Panel icon={ShieldCheck} title="Your phlebotomist">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12 ring-1 ring-border">
                    {order.phlebotomist.photoUrl && (
                      <AvatarImage
                        src={order.phlebotomist.photoUrl}
                        alt={order.phlebotomist.name}
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <ShieldCheck className="size-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{order.phlebotomist.name}</p>
                    <p className="text-xs text-muted-foreground">ID-verified professional</p>
                  </div>
                  <Button variant="outline" size="icon" asChild aria-label="Call phlebotomist">
                    <a href={`tel:${order.phlebotomist.mobile}`}>
                      <Phone className="size-4" />
                    </a>
                  </Button>
                </div>
              </Panel>
            )}

            {(order.reportUrl || canCancel) && (
              <div className="space-y-2.5">
                {order.reportUrl && (
                  <Button className="h-11 w-full" asChild>
                    <a href={order.reportUrl} target="_blank" rel="noreferrer">
                      <Download className="size-4" />
                      Download Report
                    </a>
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="outline"
                    className="h-11 w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this booking?"
        description="This action cannot be undone. Your booking will be cancelled."
        confirmLabel="Cancel Booking"
        cancelLabel="Keep Booking"
        destructive
        onConfirm={() => {
          cancelMutation.mutate(
            { reason: "Cancelled by patient" },
            { onSuccess: () => setCancelOpen(false) },
          );
        }}
      />
    </div>
  );
}

export { OrderDetailPage };

import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  FileText,
  FlaskConical,
  KeyRound,
  Layers,
  MapPin,
  Phone,
  Truck,
  UserRound,
} from "lucide-react";

import { ConfirmationSkeleton } from "@/components/checkout/ConfirmationSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrderDetail } from "@/hooks/queries/useOrders";
import { useBookingStore } from "@/store/bookingStore";
import { formatRupees } from "@/utils/format";
import type { OrderDetailPayment } from "@/types";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** The rest of the page stays on the site's normal brand gradient — only the
 *  checkmark itself is pure green, since that's the one element that's
 *  specifically saying "success", not just carrying brand color. */
const PRIMARY_GRADIENT = "from-primary to-[oklch(0.5_0.22_20)]";
const CHECK_GRADIENT = "from-emerald-500 to-emerald-700";

const CONFETTI_COLORS = [
  "bg-primary",
  "bg-success",
  "bg-warning",
  "bg-brand-teal",
  "bg-brand-violet",
];

/** What the patient should expect next. Static guidance, not a live status
 *  tracker — the order detail exposes a single `orderStatus`, not per-stage
 *  timestamps, so presenting these as "completed" steps would be misleading. */
const NEXT_STEPS = [
  {
    icon: Truck,
    title: "Phlebotomist assigned",
    body: "You'll get their name and number before the visit.",
  },
  {
    icon: FlaskConical,
    title: "Sample collected at home",
    body: "Sealed kit, collected within your chosen slot.",
  },
  { icon: FileText, title: "Reports delivered", body: "Digitally verified reports in 6–48 hours." },
];

function useConfettiDots(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
        const distance = 60 + Math.random() * 50;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          delay: Math.random() * 0.15,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        };
      }),
    [count],
  );
}

/** The old page labelled the figure "Amount paid" unconditionally, which is
 *  wrong for a Cash-on-Delivery booking where nothing has been collected yet.
 *  Label follows the payment status the API actually reports. */
function amountLabel(payment: OrderDetailPayment): string {
  if (payment.paymentStatus === "Paid") return "Amount paid";
  if (payment.paymentStatus === "Partial") return "Amount part-paid";
  return payment.paymentMode === "Cash" ? "Pay at collection" : "Amount payable";
}

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reset = useBookingStore((s) => s.reset);
  const dots = useConfettiDots(14);

  useEffect(() => {
    // Reset the checkout draft when the confirmation screen mounts so the next booking
    // starts from a clean slate.
    reset();
  }, [reset]);

  const { data: order, isLoading } = useOrderDetail(id);

  if (!id) return null;

  return (
    <div className="relative min-h-screen overflow-hidden pb-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-500/10 via-background to-background"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="flex flex-col items-center text-center">
          <div className="relative flex size-24 items-center justify-center">
            {dots.map((dot) => (
              <motion.span
                key={dot.id}
                className={`absolute size-2 rounded-full ${dot.color}`}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: dot.x, y: dot.y, opacity: 0, scale: 0.4 }}
                transition={{ duration: 0.9, delay: 0.25 + dot.delay, ease: "easeOut" }}
              />
            ))}
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-emerald-500/25 blur-xl"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className={`relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br ${CHECK_GRADIENT} text-white shadow-xl shadow-emerald-500/25`}
            >
              <Check className="size-10" strokeWidth={3} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: EASE_OUT_EXPO }}
            className="mt-5"
          >
            <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              Booking Confirmed!
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your home sample collection has been scheduled.
            </p>
            {order?.orderStatus && (
              <Badge variant="secondary" className="mt-3 gap-1.5">
                <BadgeCheck className="size-3.5" />
                {order.orderStatus}
              </Badge>
            )}
          </motion.div>
        </div>

        {isLoading || !order ? (
          <div className="mx-auto mt-8 max-w-2xl">
            <ConfirmationSkeleton />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            {/* Main column: everything about the booking itself. */}
            <div className="space-y-3">
              {/* Booking summary */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.38 }}
                className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${PRIMARY_GRADIENT} text-white shadow-sm`}
                  >
                    <CalendarClock className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-foreground">Booking details</h2>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {order.orderNo}
                    </p>
                  </div>
                </div>

                <dl className="space-y-2.5 border-t border-border/60 pt-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Collection date &amp; slot</dt>
                    <dd className="text-right font-semibold text-foreground">
                      {order.bookingDate
                        ? format(parseISO(order.bookingDate), "EEE, d MMM yyyy")
                        : "—"}
                      {order.timeSlot ? ` · ${order.timeSlot}` : ""}
                    </dd>
                  </div>

                  {order.patients.length > 0 && (
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-muted-foreground">
                        {order.patients.length === 1 ? "Patient" : "Patients"}
                      </dt>
                      <dd className="text-right font-semibold text-foreground">
                        {order.patients.map((p) => `${p.name} (${p.age}y, ${p.gender})`).join(", ")}
                      </dd>
                    </div>
                  )}
                </dl>

                {order.items.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-start gap-2">
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            {item.type === "Package" ? (
                              <Layers className="size-3" />
                            ) : (
                              <FlaskConical className="size-3" />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block leading-snug text-foreground/90">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{item.type}</span>
                          </span>
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums text-foreground">
                          {formatRupees(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>

              {/* Address */}
              {order.address && (
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.42 }}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5"
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${PRIMARY_GRADIENT} text-white shadow-sm`}
                  >
                    <MapPin className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Collection address
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-foreground">
                      {[
                        order.address.address,
                        order.address.city,
                        order.address.state,
                        order.address.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </motion.section>
              )}

              {/* Phlebotomist, once one has been assigned */}
              {order.phlebotomist && (
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.46 }}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <UserRound className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted-foreground">Your phlebotomist</p>
                    <p className="mt-0.5 truncate text-sm font-bold text-foreground">
                      {order.phlebotomist.name}
                    </p>
                  </div>
                  <a
                    href={`tel:${order.phlebotomist.mobile}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
                  >
                    <Phone className="size-3.5" />
                    Call
                  </a>
                </motion.section>
              )}

              {/* What happens next */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.5 }}
                className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5"
              >
                <h2 className="mb-3 text-sm font-bold text-foreground">What happens next</h2>
                <ol className="space-y-3">
                  {NEXT_STEPS.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <li key={step.title} className="flex items-start gap-3">
                        <span className="relative flex flex-col items-center">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="size-4" />
                          </span>
                          {i < NEXT_STEPS.length - 1 && (
                            <span aria-hidden className="mt-1 h-5 w-px bg-border" />
                          )}
                        </span>
                        <span className="min-w-0 pb-1">
                          <span className="block text-sm font-semibold text-foreground">
                            {step.title}
                          </span>
                          <span className="block text-xs leading-relaxed text-muted-foreground">
                            {step.body}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </motion.section>
            </div>

            {/* Aside: the PIN and the money, pinned alongside the details on
                desktop — first on mobile since it's what the patient needs
                fastest at the door. */}
            <aside className="order-first space-y-3 lg:order-last lg:sticky lg:top-20">
              {order.servicePin && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.34 }}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${PRIMARY_GRADIENT} p-4 shadow-lg`}
                >
                  <div
                    aria-hidden
                    className="absolute -top-10 -right-8 size-32 rounded-full bg-white/20 blur-2xl"
                  />
                  <div className="relative flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm">
                      <KeyRound className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium tracking-wide text-white/70 uppercase">
                        Service PIN
                      </p>
                      <p className="font-mono text-2xl font-extrabold tracking-[0.2em] text-white">
                        {order.servicePin}
                      </p>
                    </div>
                  </div>
                  <p className="relative mt-2.5 text-[11px] leading-relaxed text-white/70">
                    Share this PIN with your phlebotomist to verify the visit.
                  </p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.38 }}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
              >
                <div
                  className={`relative overflow-hidden bg-gradient-to-br ${PRIMARY_GRADIENT} px-5 py-5 text-center`}
                >
                  <div
                    aria-hidden
                    className="absolute -top-10 -right-8 size-32 rounded-full bg-white/20 blur-2xl"
                  />
                  <div className="relative">
                    <p className="text-[11px] font-medium tracking-wide text-white/70 uppercase">
                      {amountLabel(order.payment)}
                    </p>
                    <p className="mt-1 text-3xl font-extrabold tabular-nums text-white">
                      {formatRupees(order.payment.amount)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5 px-5 py-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Payment method</span>
                    <Badge variant="outline" className="text-[11px]">
                      {order.payment.paymentMode}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant={order.payment.paymentStatus === "Paid" ? "success" : "secondary"}
                      className="text-[11px]"
                    >
                      {order.payment.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </motion.div>

              <div className="flex flex-col gap-2.5">
                <motion.button
                  type="button"
                  onClick={() => navigate(`/orders/${id}`)}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", damping: 20, stiffness: 400 }}
                  className={`group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r ${PRIMARY_GRADIENT} text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-shadow hover:shadow-xl hover:shadow-primary/40`}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  View Booking
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </motion.button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </Button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

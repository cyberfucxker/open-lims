import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { Check, Copy, Percent, Tag, TicketPercent } from "lucide-react";

import type { HomeCoupon } from "@/types";

interface OffersSectionProps {
  coupons: HomeCoupon[];
}

function OffersSection({ coupons }: OffersSectionProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (coupons.length === 0) return null;

  async function handleCopy(coupon: HomeCoupon) {
    try {
      await navigator.clipboard.writeText(coupon.coupon_code);
      setCopiedId(coupon.id);
      toast.success(`Code "${coupon.coupon_code}" copied`);
      setTimeout(() => setCopiedId((current) => (current === coupon.id ? null : current)), 1800);
    } catch {
      toast.error("Couldn't copy the code — copy it manually.");
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-4 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <TicketPercent className="size-4" />
        </span>
        <h2 className="text-lg font-bold text-foreground sm:text-xl">Offers for you</h2>
      </motion.div>

      <div className="scrollbar-thin flex gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain py-2 sm:grid sm:grid-cols-2 sm:overflow-x-visible sm:overflow-y-visible">
        {coupons.map((coupon, i) => {
          const copied = copiedId === coupon.id;
          return (
            <motion.div
              key={coupon.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
              className="relative flex min-w-72 shrink-0 flex-col gap-4 overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-gradient-to-br from-accent/60 to-card p-5 shadow-sm sm:min-w-0 sm:p-6"
            >
              <div
                aria-hidden
                className="absolute -top-8 -right-8 size-24 rounded-full bg-primary/10"
              />

              <div className="relative flex items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  {coupon.discount_type === "percentage" ? (
                    <Percent className="size-5.5" />
                  ) : (
                    <Tag className="size-5.5" />
                  )}
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-semibold text-foreground sm:text-base">
                    {coupon.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Min. order ₹{coupon.min_booking_amount.toLocaleString("en-IN")}
                    {coupon.valid_till &&
                      ` · Valid till ${format(new Date(coupon.valid_till), "d MMM yyyy")}`}
                  </p>
                </div>
              </div>

              <div className="relative mt-auto flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-card/80 p-2 pl-4">
                <span className="flex-1 truncate text-sm font-bold tracking-wide text-primary">
                  {coupon.coupon_code}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(coupon)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-transform active:scale-95"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export { OffersSection };

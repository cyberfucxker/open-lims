import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAddToCart } from "@/hooks/queries/useCart";
import { formatRupees } from "@/utils/format";
import type { PackageCatalogItem } from "@/types";

/** Collapsed list length — shorter on phones, where it stacks to one column. */
const PREVIEW_DESKTOP = 8;
const PREVIEW_MOBILE = 4;

interface OfferPackageCardProps {
  pkg: PackageCatalogItem;
  position: number;
  /** Text for the card's top strip — "Most booked in Jaipur" on the page's
   *  most-booked package, the collection line on the rest. */
  label: string;
}

function OfferPackageCard({ pkg, position, label }: OfferPackageCardProps) {
  const addToCart = useAddToCart();
  const [showAll, setShowAll] = useState(false);
  const includes = pkg.includes ?? [];
  const visible = showAll ? includes : includes.slice(0, PREVIEW_DESKTOP);
  const hiddenOnMobile = Math.max(includes.length - PREVIEW_MOBILE, 0);
  const hiddenOnDesktop = Math.max(includes.length - PREVIEW_DESKTOP, 0);
  const saving = Math.max(pkg.actual_price - pkg.offer_price, 0);
  const savingPct = pkg.actual_price > 0 ? Math.round((saving / pkg.actual_price) * 100) : 0;
  const added = pkg.is_added_to_cart || addToCart.isSuccess;

  return (
    <article className="grid overflow-hidden rounded-xl border-2 border-brand-navy bg-white md:grid-cols-[1fr_17rem]">
      <div className="col-span-full flex items-center justify-between gap-3 bg-brand-navy px-5 py-2 text-xs font-semibold tracking-wide text-white sm:px-7">
        <span>{label}</span>
        {savingPct > 0 && <span className="text-white/80">Save {savingPct}% on MRP</span>}
      </div>
      <div className="flex flex-col gap-5 p-5 sm:p-7">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
            <span className="tabular-nums">{String(position).padStart(2, "0")}</span>
          </div>
          <h3 className="text-xl leading-snug font-semibold text-balance text-brand-navy sm:text-2xl">
            {pkg.package_name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {pkg.parameter_count} parameters
            <span className="mx-2 text-border">|</span>
            Report in {pkg.reporting_time}
          </p>
        </div>

        {includes.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold tracking-[0.12em] text-foreground/70 uppercase">
              Includes
            </p>
            <ul className="grid gap-x-6 gap-y-2 text-sm text-foreground/90 sm:grid-cols-2">
              {visible.map((item, i) => (
                <li
                  key={item.name}
                  className={`items-start gap-2 ${!showAll && i >= PREVIEW_MOBILE ? "hidden sm:flex" : "flex"}`}
                >
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                  <span>{item.name}</span>
                </li>
              ))}
            </ul>
            {hiddenOnMobile > 0 && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className={`self-start text-sm font-medium text-brand-navy underline-offset-4 hover:underline ${
                  !showAll && hiddenOnDesktop === 0 ? "sm:hidden" : ""
                }`}
              >
                {showAll ? (
                  "Show less"
                ) : (
                  <>
                    <span className="sm:hidden">+ {hiddenOnMobile} more tests</span>
                    <span className="hidden sm:inline">+ {hiddenOnDesktop} more tests</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between gap-5 border-t border-border bg-secondary/50 p-5 sm:p-7 md:border-t-0 md:border-l">
        <div className="flex flex-col gap-1">
          {saving > 0 && (
            <p className="flex items-baseline gap-1.5 text-muted-foreground">
              <span className="text-sm font-medium">MRP</span>
              <span className="text-xl font-semibold tabular-nums line-through decoration-primary/80 decoration-2">
                {formatRupees(pkg.actual_price)}
              </span>
            </p>
          )}
          <p className="text-5xl leading-tight font-extrabold tracking-tight text-primary tabular-nums">
            {formatRupees(pkg.offer_price)}
          </p>
          {saving > 0 && (
            <p className="text-sm font-medium text-success">
              You save {formatRupees(saving)} ({savingPct}%)
            </p>
          )}
        </div>

        {added ? (
          <Button
            asChild
            variant="outline"
            className="h-12 w-full border-brand-navy/30 text-base text-brand-navy"
          >
            <Link to="/cart">
              <Check className="size-4" aria-hidden />
              Added — view cart
            </Link>
          </Button>
        ) : (
          <Button
            className="h-12 w-full text-base"
            disabled={addToCart.isPending}
            onClick={() => addToCart.mutate({ type: "1", type_id: pkg.id })}
          >
            {addToCart.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <>
                Add to cart
                <ArrowRight className="size-4" aria-hidden />
              </>
            )}
          </Button>
        )}
      </div>
    </article>
  );
}

export { OfferPackageCard };

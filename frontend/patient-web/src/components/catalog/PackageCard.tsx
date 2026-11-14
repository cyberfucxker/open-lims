import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Clock, ListChecks, Loader2, Plus, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAddToCart } from "@/hooks/queries/useCart";
import { useCityStore } from "@/store/cityStore";
import { cn } from "@/utils/cn";
import { formatBookedCount, formatRupees } from "@/utils/format";
import { buildCatalogItemPath } from "@/utils/routes";
import type { PackageCatalogItem } from "@/types";

interface PackageCardProps {
  pkg: PackageCatalogItem;
  index?: number;
  /** "default" is the card used in the Catalog grid; "premium" is a taller,
   *  richer card for the home page showcase. */
  variant?: "default" | "premium";
}

function PackageCard({ pkg, index = 0, variant = "default" }: PackageCardProps) {
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  // City-slug URL when a city is actually picked (real SEO value — see
  // routes/index.tsx) — plain id URL otherwise, since there's no city slug
  // to build the nicer one with yet.
  const citySlug = useCityStore((s) => s.city?.slug);
  const detailPath = buildCatalogItemPath({
    kind: "packages",
    id: pkg.id,
    slug: pkg.slug,
    citySlug,
  });
  const discount = Math.round(((pkg.actual_price - pkg.offer_price) / pkg.actual_price) * 100);
  const added = pkg.is_added_to_cart || addToCart.isSuccess;
  const isPremium = variant === "premium";
  const bookedLabel = formatBookedCount(pkg.booked_count);

  return (
    <motion.div
      custom={index}
      initial={{ opacity: 0, y: 20, scale: isPremium ? 0.96 : 1 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: isPremium ? -6 : -5 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <Card
        role="button"
        tabIndex={0}
        onClick={() => navigate(detailPath)}
        onKeyDown={(e) => {
          if (e.key === "Enter") navigate(detailPath);
        }}
        className={cn(
          "relative flex h-full cursor-pointer flex-col gap-3 overflow-hidden rounded-2xl border-border/60 transition-all hover:border-primary/30 hover:shadow-xl",
          isPremium ? "rounded-3xl p-5 shadow-sm sm:p-6" : "p-4",
        )}
      >
        <span
          aria-hidden
          className={cn("absolute inset-x-0 top-0 bg-[#1f3e6d]", isPremium ? "h-1.5" : "h-1")}
        />

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {pkg.tag === "Popular" && (
                <Badge variant="gradient" className={cn(isPremium && "gap-1")}>
                  {isPremium && <Sparkles className="size-3" />}
                  Popular
                </Badge>
              )}
            </div>
            <p
              className={cn(
                "mt-1 line-clamp-2 leading-snug font-semibold",
                isPremium ? "text-base sm:text-lg" : "text-sm",
              )}
            >
              {pkg.package_name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{pkg.package_code}</p>
          </div>
          {discount > 0 && (
            <Badge variant="success" className="shrink-0">
              {discount}% off
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="gap-1">
            <ListChecks className="size-3" />
            {pkg.parameter_count} parameters
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="size-3" />
            {pkg.reporting_time}
          </Badge>
        </div>

        {bookedLabel && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Users className="size-3.5" />
            {bookedLabel}
          </p>
        )}

        {isPremium && <div className="flex-1" />}

        <div
          className={cn(
            "mt-auto flex flex-col gap-2 border-t border-border/60 pt-3",
            isPremium && "pt-4",
          )}
        >
          <div className="flex items-baseline gap-1.5">
            <span className={cn("font-bold text-foreground", isPremium ? "text-xl" : "text-base")}>
              {formatRupees(pkg.offer_price)}
            </span>
            {pkg.actual_price > pkg.offer_price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatRupees(pkg.actual_price)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                navigate(detailPath);
              }}
            >
              Know More
            </Button>

            <Button
              size="sm"
              variant={added ? "secondary" : "default"}
              className="flex-1"
              disabled={addToCart.isPending || added}
              onClick={(e) => {
                e.stopPropagation();
                addToCart.mutate({ type: "1", type_id: pkg.id });
              }}
            >
              {addToCart.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : added ? (
                <motion.span
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1"
                >
                  <Check className="size-4" /> Added
                </motion.span>
              ) : (
                <>
                  <Plus className="size-4" /> Add
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export { PackageCard };

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Clock,
  CornerDownRight,
  Info,
  ListChecks,
  Loader2,
  Plus,
  Smartphone,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAppUrl } from "@/config/appLinks";
import { useAddToCart } from "@/hooks/queries/useCart";
import { useCityStore } from "@/store/cityStore";
import { formatBookedCount, formatRupees } from "@/utils/format";
import { buildCatalogItemPath } from "@/utils/routes";
import type { TestCatalogItem } from "@/types";

interface TestCardProps {
  test: TestCatalogItem;
  index?: number;
}

function TestCard({ test, index = 0 }: TestCardProps) {
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  // City-slug URL when a city is actually picked (real SEO value — see
  // routes/index.tsx) — plain id URL otherwise, since there's no city slug
  // to build the nicer one with yet. This list mixes real Tests with
  // directly-bookable Parameters, which live at `/parameter/...` instead —
  // `buildCatalogItemPath` picks the right family off `is_parameter`.
  const citySlug = useCityStore((s) => s.city?.slug);
  const detailPath = buildCatalogItemPath({
    kind: "tests",
    id: test.id,
    slug: test.slug,
    citySlug,
    isParameter: test.is_parameter,
  });
  const discount = Math.round(((test.price - test.offer_price) / test.price) * 100);
  const added = test.is_added_to_cart || addToCart.isSuccess;
  const bookedLabel = formatBookedCount(test.booked_count);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <Card
        role="button"
        tabIndex={0}
        onClick={() => navigate(detailPath)}
        onKeyDown={(e) => {
          if (e.key === "Enter") navigate(detailPath);
        }}
        className="relative flex h-full cursor-pointer flex-col gap-3 overflow-hidden rounded-2xl border-border/60 p-4 transition-all hover:border-primary/30 hover:shadow-xl"
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[#1f3e6d]" />

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold leading-snug">{test.test_name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{test.test_code}</p>
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
            {test.parameter_count} parameters
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="size-3" />
            {test.reporting_time}
          </Badge>
        </div>

        {bookedLabel && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          >
            <Users className="size-3.5" />
            {bookedLabel}
          </motion.p>
        )}

        <div className="mt-auto flex flex-col gap-2 border-t border-border/60 pt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-foreground">
              {formatRupees(test.offer_price)}
            </span>
            {test.price > test.offer_price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatRupees(test.price)}
              </span>
            )}
          </div>

          {/* The app-exclusive 5% coupon (`CouponPlatformRestriction.APP_ONLY`)
              only redeems from the app, so this is purely a come-on for
              install, not a claim this website itself can honour — same
              reasoning as the "Get extra 5% with app" banner it replaces,
              now attached to the specific test it discounts instead of
              sitting once below the whole list. */}
          <a
            href={getAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Get an extra 15% off this test in the Example Lab app"
            className="group/app -mt-1 flex items-center gap-1.5 text-xs"
          >
            <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="font-bold text-primary">Extra 15% OFF</span>
            <span className="text-muted-foreground">With</span>
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Smartphone className="size-2.5" />
            </span>
            <span className="font-semibold text-foreground">App</span>
            <Info className="size-3 shrink-0 text-muted-foreground transition-colors group-hover/app:text-foreground" />
          </a>

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
                addToCart.mutate({ type: "3", type_id: test.id });
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

export { TestCard };

import { motion } from "framer-motion";
import { FlaskConical, Layers, Loader2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRemoveCartItem } from "@/hooks/queries/useCart";
import { formatRupees } from "@/utils/format";
import type { CartItemResult } from "@/types";

interface CartItemCardProps {
  item: CartItemResult;
  index?: number;
}

/** The cart DTO (`CartItemResult`) carries no explicit item type — the backend
 *  knows it but only sends `testCode`, where packages are prefixed "PKG-"
 *  (see `cart.service.ts#toCartItems`) and tests use their short name. Derived
 *  here rather than changing the API; if the response ever gains a real
 *  `itemType` field, swap this for it. */
function isPackage(testCode: string): boolean {
  return testCode.toUpperCase().startsWith("PKG-");
}

/** Premium cart line — icon tile, name/code, price block and remove action.
 *  Enter/exit/layout animation is preserved from the row it replaces so
 *  removals still slide out and the list reflows smoothly. */
function CartItemCard({ item, index = 0 }: CartItemCardProps) {
  const removeItem = useRemoveCartItem();
  const pkg = isPackage(item.testCode);
  const Icon = pkg ? Layers : FlaskConical;
  const saving = item.mrp - item.salePrice;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -32, transition: { duration: 0.2, ease: "easeIn" } }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="group relative flex items-start gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-shadow hover:shadow-lg sm:gap-4"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-[oklch(0.5_0.22_20)] opacity-0 transition-opacity group-hover:opacity-100"
      />

      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm sm:size-12 ${
          pkg
            ? "bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)]"
            : "bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)]"
        }`}
      >
        <Icon className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">
          {item.testName}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[11px]">
            {pkg ? "Package" : "Lab Test"}
          </Badge>
          <span className="font-mono text-[11px] text-muted-foreground">{item.testCode}</span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-base font-bold tabular-nums text-foreground sm:text-lg">
            {formatRupees(item.salePrice)}
          </span>
          {item.mrp > item.salePrice && (
            <span className="text-xs tabular-nums text-muted-foreground line-through">
              {formatRupees(item.mrp)}
            </span>
          )}
          {item.discountPercentage > 0 && (
            <Badge variant="success" className="text-[11px]">
              {item.discountPercentage}% off
            </Badge>
          )}
        </div>

        {saving > 0 && (
          <p className="mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            You save {formatRupees(saving)}
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Remove ${item.testName}`}
        disabled={removeItem.isPending}
        onClick={() => removeItem.mutate({ cart_id: item.id })}
        className="shrink-0 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        {removeItem.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
      </Button>
    </motion.div>
  );
}

export { CartItemCard };

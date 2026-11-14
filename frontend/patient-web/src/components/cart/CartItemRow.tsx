import { motion } from "framer-motion";
import { Loader2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRemoveCartItem } from "@/hooks/queries/useCart";
import type { CartItemResult } from "@/types";

interface CartItemRowProps {
  item: CartItemResult;
  index?: number;
}

function CartItemRow({ item, index = 0 }: CartItemRowProps) {
  const removeItem = useRemoveCartItem();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -32, transition: { duration: 0.2, ease: "easeIn" } }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04, ease: "easeOut" }}
      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
    >
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.testName}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.testCode}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
          <span className="text-base font-bold">₹{item.salePrice.toLocaleString("en-IN")}</span>
          {item.mrp > item.salePrice && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{item.mrp.toLocaleString("en-IN")}
            </span>
          )}
          {item.discountPercentage > 0 && (
            <Badge variant="success">{item.discountPercentage}% off</Badge>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Remove item"
        disabled={removeItem.isPending}
        onClick={() => removeItem.mutate({ cart_id: item.id })}
      >
        {removeItem.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4 text-destructive" />
        )}
      </Button>
    </motion.div>
  );
}

export { CartItemRow };

import { motion } from "framer-motion";
import { FlaskConical, ShoppingCart, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmptyCartProps {
  onBrowse: () => void;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Empty-cart state with a light illustration — replaces the generic
 *  `EmptyState` here so the cart gets its own artwork and copy while other
 *  pages keep the shared component. */
function EmptyCart({ onBrowse }: EmptyCartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className="flex flex-col items-center px-6 py-14 text-center"
    >
      <div className="relative mb-6 flex size-32 items-center justify-center">
        <div
          aria-hidden
          className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 blur-xl"
        />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex size-24 items-center justify-center rounded-3xl border border-border/60 bg-card shadow-lg"
        >
          <ShoppingCart className="size-10 text-primary" />
        </motion.div>

        <motion.span
          animate={{ y: [0, -6, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="absolute -top-1 -right-1 flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] text-white shadow-lg"
        >
          <FlaskConical className="size-5" />
        </motion.span>

        <motion.span
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1 -left-2 text-primary"
        >
          <Sparkles className="size-5" />
        </motion.span>
      </div>

      <h2 className="text-lg font-bold tracking-tight text-foreground">Your cart is empty</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Add lab tests or a health package to get started — free home sample collection on every
        booking.
      </p>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-6">
        <Button
          size="lg"
          onClick={onBrowse}
          className="bg-gradient-to-r from-primary to-[oklch(0.5_0.22_20)] shadow-lg shadow-primary/25"
        >
          Browse Tests &amp; Packages
        </Button>
      </motion.div>
    </motion.div>
  );
}

export { EmptyCart };

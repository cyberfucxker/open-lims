import { motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface PaymentResultProps {
  status: "success" | "failed";
  title: string;
  description?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

function PaymentResult({
  status,
  title,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: PaymentResultProps) {
  const isFailed = status === "failed";

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="relative flex size-16 items-center justify-center">
        {isFailed && (
          <motion.span
            className="absolute inset-0 rounded-full bg-destructive/20"
            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={
            isFailed ? { scale: 1, opacity: 1, x: [0, -6, 6, -4, 4, 0] } : { scale: 1, opacity: 1 }
          }
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "relative flex size-16 items-center justify-center rounded-full",
            isFailed ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
          )}
        >
          {isFailed ? <X className="size-8" /> : <CheckCircle2 className="size-8" />}
        </motion.div>
      </div>

      <div className="space-y-1">
        <p className="text-base font-semibold">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="flex w-full flex-col gap-2">
        <Button size="lg" className="w-full" onClick={onPrimary}>
          {primaryLabel}
        </Button>
        {secondaryLabel && onSecondary && (
          <Button variant="ghost" className="w-full" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export { PaymentResult };

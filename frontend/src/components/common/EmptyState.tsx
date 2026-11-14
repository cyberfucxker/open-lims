import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { SearchX, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  onAction?: () => void;
  actionLabel?: string;
}

function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
  onAction,
  actionLabel,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex size-20 items-center justify-center rounded-3xl bg-primary/10"
      >
        <div className="absolute inset-0 animate-pulse rounded-3xl bg-primary/5 blur-xl" />
        <Icon className="relative size-9 text-primary/60" strokeWidth={1.5} />
      </motion.div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-navy-950">{title}</p>
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action ??
        (onAction && actionLabel && (
          <Button size="sm" variant="outline" onClick={onAction} className="mt-1">
            {actionLabel}
          </Button>
        ))}
    </motion.div>
  );
}

export { EmptyState };

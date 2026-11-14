import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface FormSectionProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
  index?: number;
}

function FormSection({
  title,
  description,
  icon: Icon,
  children,
  className,
  index = 0,
}: FormSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className={cn("overflow-visible", className)}>
        <CardHeader className="flex-row items-center gap-3 space-y-0 border-b border-border pb-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Icon className="size-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-navy-950">{title}</h3>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-4 gap-y-5 pt-5 sm:grid-cols-2">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { FormSection };

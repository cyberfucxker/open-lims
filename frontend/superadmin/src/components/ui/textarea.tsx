import * as React from "react";

import { cn } from "@/utils/cn";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  invalid?: boolean;
}

function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      aria-invalid={invalid || undefined}
      className={cn(
        "flex min-h-24 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm shadow-sm outline-none transition-[color,box-shadow,border-color] duration-200 selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15",
        "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/10",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
export type { TextareaProps };

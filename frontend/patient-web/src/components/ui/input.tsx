import * as React from "react";

import { cn } from "@/utils/cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

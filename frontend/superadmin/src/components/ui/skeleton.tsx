import { cn } from "@/utils/cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("shimmer-bg rounded-lg", className)} {...props} />;
}

export { Skeleton };

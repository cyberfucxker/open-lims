import { Loader2 } from "lucide-react";

/** Shown while the initial silent-refresh/session bootstrap is in flight. */
function FullPageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <Loader2 className="size-8 animate-spin text-primary" aria-label="Loading" />
    </div>
  );
}

export { FullPageLoader };

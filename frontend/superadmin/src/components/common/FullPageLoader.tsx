import { Activity } from "lucide-react";

function FullPageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-12 animate-pulse items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25">
          <Activity className="size-6" strokeWidth={2.5} />
        </div>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

export { FullPageLoader };

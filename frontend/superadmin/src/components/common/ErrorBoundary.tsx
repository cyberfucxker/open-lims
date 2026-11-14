import { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time errors so a crash shows something actionable instead of
 * a blank white page.
 *
 * Without this, any thrown error unmounts the entire tree and the browser is
 * left showing nothing at all — no message, no navigation, no clue which
 * component failed. The only way to find out was the devtools console, which
 * is not where the person hitting the bug is looking.
 *
 * Deliberately a class component: `componentDidCatch` has no hook equivalent.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keeps the component stack in the console for whoever debugs it; React
    // only logs this itself in development.
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-6">
        <div className="flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <TriangleAlert className="size-6" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-lg font-semibold text-foreground">Something broke on this page</h1>
            <p className="text-sm text-muted-foreground">
              The page failed to render. Reloading usually clears it — if it keeps happening, send
              this message to the development team.
            </p>
          </div>
          <pre className="max-h-40 w-full overflow-auto rounded-xl bg-secondary/60 p-3 text-left text-xs whitespace-pre-wrap text-muted-foreground">
            {error.message}
          </pre>
          <div className="flex items-center gap-2">
            <Button onClick={() => window.location.reload()}>
              <RotateCcw className="size-4" /> Reload page
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Go to dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export { ErrorBoundary };

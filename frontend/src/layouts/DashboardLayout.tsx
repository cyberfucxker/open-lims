import type { PropsWithChildren, ReactNode } from "react";

import { Logo } from "@/components/brand/Logo";

interface DashboardLayoutProps extends PropsWithChildren {
  headerActions?: ReactNode;
}

/**
 * Minimal shell for authenticated screens. Intentionally bare for now —
 * navigation, sidebar, and header will be added once the dashboard scope
 * is defined.
 */
function DashboardLayout({ children, headerActions }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-secondary">
      <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <Logo />
        {headerActions}
      </header>
      <main className="flex flex-1 items-center justify-center p-6">{children}</main>
    </div>
  );
}

export { DashboardLayout };

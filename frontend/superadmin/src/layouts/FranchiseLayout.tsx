import { Building2, LogOut, Menu } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";

import { Logo } from "@/components/brand/Logo";
import { FloatingGradients } from "@/components/layout/FloatingGradients";
import {
  Sidebar,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { franchiseNavGroups } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFranchiseProfile } from "@/hooks/queries/useFranchise";
import { useUiStore } from "@/lib/stores/ui-store";
import { FranchiseNotificationBell } from "@/pages/franchise/FranchiseNotificationBell";

/**
 * Shell for the franchise portal.
 *
 * Reuses the admin `Sidebar` (now nav-pluggable) and the same animated outlet,
 * so the two panels stay visually identical. The header is a minimal bar rather
 * than the admin `Topbar`, which is wired to admin-only global search — but it
 * does get its own notification bell, backed by this franchise's own
 * `OrganizationNotification` feed rather than the admin-only one.
 */
function FranchiseLayout() {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();
  const location = useLocation();
  const { logout } = useAuth();
  const { data: profile } = useFranchiseProfile();

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div className="min-h-svh bg-secondary/40">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        groups={franchiseNavGroups}
      />

      <div
        className="flex min-h-svh flex-col max-lg:ml-0!"
        style={{
          marginLeft: sidebarWidth,
          transition: "margin-left 0.28s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <header className="glass-panel sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border/70 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-[18px]" />
          </Button>
          <Logo className="h-6 lg:hidden" />

          <div className="ml-auto flex items-center gap-3">
            <FranchiseNotificationBell />
            {profile && (
              <div className="hidden items-center gap-2.5 sm:flex">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-4" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-foreground">{profile.name}</span>
                  <span className="font-mono text-[11px] tracking-wider text-muted-foreground">
                    {profile.code}
                  </span>
                </div>
                {profile.franchiseType === "CO_LAB" && <Badge variant="success">Co-Lab</Badge>}
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="Log out">
              <LogOut className="size-[18px]" />
            </Button>
          </div>
        </header>

        <main className="relative flex-1">
          <FloatingGradients />
          {/* Keyed on the path so each route re-triggers the fade, but the
              fade is a plain CSS animation over a normally-visible element —
              NOT a framer-motion `initial: { opacity: 0 }` inside
              `AnimatePresence mode="wait"`, which is what this used to be.
              That combination could leave a freshly-navigated page stuck at
              opacity 0 (reproduced on /support): `mode="wait"` mounts the
              incoming child from an animation callback after the outgoing
              exit resolves, and under StrictMode's double-mount the enter
              animation was sometimes dropped, so the page sat invisible
              until you clicked the same nav item again. Page content must
              never depend on an animation having run. */}
          <div
            key={location.pathname}
            className="route-fade-in mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8"
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export { FranchiseLayout };

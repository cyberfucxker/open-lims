import { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { FloatingGradients } from "@/components/layout/FloatingGradients";
import {
  Sidebar,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useUiStore } from "@/lib/stores/ui-store";
import { canAccessPath, isManager } from "@/config/staffModules";
import { navGroups } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";

function DashboardLayout() {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();
  const location = useLocation();
  const { user } = useAuth();
  // A manager sees only their granted modules; ADMIN gets the full nav.
  const groups = useMemo(
    () =>
      isManager(user)
        ? navGroups
            .map((g) => ({ ...g, items: g.items.filter((i) => canAccessPath(user, i.path)) }))
            .filter((g) => g.items.length > 0)
        : navGroups,
    [user],
  );

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div className="min-h-svh bg-secondary/40">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        groups={groups}
      />

      <div
        className="flex min-h-svh flex-col max-lg:ml-0!"
        style={{
          marginLeft: sidebarWidth,
          transition: "margin-left 0.28s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <Topbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

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

export { DashboardLayout };

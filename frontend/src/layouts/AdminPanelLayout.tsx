import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import {
  Sidebar,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const AUTO_COLLAPSE_ROUTES = new Set(["/admin/patients/register"]);

/**
 * Shell for the admin panel: sidebar + topbar + animated route outlet.
 * Kept separate from `DashboardLayout` (still used by the Franchise stub)
 * so nothing about the existing Login-adjacent screens changes.
 */
function AdminPanelLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isAutoCollapseRoute = AUTO_COLLAPSE_ROUTES.has(location.pathname);

  // Auto-collapse the sidebar on space-hungry single-screen forms (currently
  // just Patient Registration) and restore whatever state it was in before,
  // on exit — a ref (not the `collapsed` state itself) tracks the prior
  // value so a manual toggle while already on the route doesn't get
  // clobbered by this effect re-running.
  const collapsedRef = useRef(collapsed);
  collapsedRef.current = collapsed;
  const collapsedBeforeAutoRoute = useRef<boolean | null>(null);
  useEffect(() => {
    if (isAutoCollapseRoute) {
      collapsedBeforeAutoRoute.current = collapsedRef.current;
      setCollapsed(true);
    } else if (collapsedBeforeAutoRoute.current !== null) {
      setCollapsed(collapsedBeforeAutoRoute.current);
      collapsedBeforeAutoRoute.current = null;
    }
  }, [isAutoCollapseRoute]);

  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div className="min-h-svh bg-secondary/40">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />

      <div
        className="flex min-h-svh flex-col max-lg:ml-0!"
        style={{
          marginLeft: sidebarWidth,
          transition: "margin-left 0.28s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <Topbar onOpenMobileSidebar={() => setMobileOpen(true)} />

        <main className="relative flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export { AdminPanelLayout };

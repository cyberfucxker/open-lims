import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, LayoutDashboard, Moon, Receipt, Sun, TestTube, Users } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { Logo } from "@/components/brand/Logo";
import {
  Sidebar,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import type { NavItem } from "@/config/navigation";
import { useMyOrganization } from "@/hooks/queries/useMyOrganization";
import { useTheme } from "@/hooks/useTheme";
import type { OrganizationModule } from "@/types/organization";

const MODULE_NAV: Record<OrganizationModule, NavItem> = {
  patients: {
    label: "Patients",
    icon: Users,
    children: [
      { label: "Register Patient", path: "/portal/patients/register" },
      { label: "Patient List", path: "/portal/patients" },
    ],
  },
  samples: { label: "Sample Collection", icon: TestTube, path: "/portal/samples" },
  reports: { label: "Reports", icon: FileText, path: "/portal/reports" },
  invoices: { label: "Invoices", icon: Receipt, path: "/portal/invoices" },
};

/**
 * Shell for the Collection Center portal — mirrors `AdminPanelLayout`'s
 * sidebar + animated outlet structure (reusing `Sidebar`/`SidebarNav`
 * directly), but the nav list is derived from the logged-in organization's
 * `enabledModules` instead of the fixed admin `NAV_ITEMS`, and the header is
 * a minimal bar rather than the admin `Topbar` (which is wired to
 * admin-only global search/notifications).
 */
function PortalLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { data: organization } = useMyOrganization();

  const navItems = useMemo<NavItem[]>(() => {
    const dashboard: NavItem = {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/portal/dashboard",
    };
    const modules = (organization?.enabledModules ?? []).map((module) => MODULE_NAV[module]);
    return [dashboard, ...modules];
  }, [organization]);

  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div className="min-h-svh bg-secondary/40">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        items={navItems}
      />

      <div
        className="flex min-h-svh flex-col max-lg:ml-0!"
        style={{
          marginLeft: sidebarWidth,
          transition: "margin-left 0.28s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <header className="glass-panel sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border/70 px-4 sm:px-6">
          <Logo className="h-6 lg:hidden" />
          <div className="ml-auto flex items-center gap-2">
            {organization && (
              <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                {organization.name}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? (
                <Sun className="size-[18px]" />
              ) : (
                <Moon className="size-[18px]" />
              )}
            </Button>
            <LogoutButton />
          </div>
        </header>

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

export { PortalLayout };

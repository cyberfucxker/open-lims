import { motion } from "framer-motion";
import { ChevronsLeft } from "lucide-react";

import { SidebarNav } from "@/components/layout/SidebarNav";
import { Logo } from "@/components/brand/Logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { NavItem } from "@/config/navigation";
import { cn } from "@/utils/cn";

export const SIDEBAR_WIDTH_EXPANDED = 264;
export const SIDEBAR_WIDTH_COLLAPSED = 80;

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  /** See `SidebarNav`'s `items` prop — lets the Collection Center portal
   *  reuse this same shell with its own nav list. */
  items?: NavItem[];
}

function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileOpenChange,
  items,
}: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border/70 lg:flex"
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-border/70 px-4",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              R
            </div>
          ) : (
            <Logo className="h-7" />
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav collapsed={collapsed} items={items} />
        </div>

        <div className="border-t border-border/70 p-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronsLeft className="size-4" />
            </motion.span>
            {!collapsed && "Collapse"}
          </button>
        </div>
      </motion.aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="flex-row items-center border-b border-border px-4 py-4">
            <SheetTitle asChild>
              <Logo className="h-7" />
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto py-4">
            <SidebarNav onNavigate={() => onMobileOpenChange(false)} items={items} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export { Sidebar };

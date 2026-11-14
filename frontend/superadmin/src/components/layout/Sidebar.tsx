import { motion } from "framer-motion";
import { ChevronsLeft } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { SidebarNav } from "@/components/layout/SidebarNav";
import type { NavGroup } from "@/config/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/utils/cn";

export const SIDEBAR_WIDTH_EXPANDED = 268;
export const SIDEBAR_WIDTH_COLLAPSED = 80;

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  /** Omitted renders the admin nav — see `SidebarNav`. */
  groups?: NavGroup[];
}

function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileOpenChange,
  groups,
}: SidebarProps) {
  return (
    <>
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
          <Logo iconOnly={collapsed} />
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto py-4">
          <SidebarNav collapsed={collapsed} groups={groups} />
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

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="flex-row items-center border-b border-border px-4 py-4">
            <SheetTitle asChild>
              <Logo />
            </SheetTitle>
          </SheetHeader>
          <div className="scrollbar-thin overflow-y-auto py-4">
            <SidebarNav groups={groups} onNavigate={() => onMobileOpenChange(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export { Sidebar };

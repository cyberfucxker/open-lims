import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import { NAV_ITEMS, type NavItem } from "@/config/navigation";
import { cn } from "@/utils/cn";

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  /** Defaults to the admin `NAV_ITEMS` — the Collection Center portal passes
   *  its own (enabledModules-filtered) list instead of duplicating this
   *  entire component tree just to render different links. */
  items?: NavItem[];
}

function SidebarNav({ collapsed = false, onNavigate, items = NAV_ITEMS }: SidebarNavProps) {
  const { pathname } = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    items.forEach((item) => {
      if (item.children?.some((child) => pathname.startsWith(child.path))) {
        initial[item.label] = true;
      }
    });
    return initial;
  });

  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const Icon = item.icon;

        if (!item.children) {
          const isActive = item.path === pathname;
          return (
            <NavLink
              key={item.label}
              to={item.path!}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="absolute inset-0 rounded-xl bg-primary shadow-lg shadow-primary/25"
                />
              )}
              <Icon className="relative z-10 size-[18px] shrink-0" />
              {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
            </NavLink>
          );
        }

        const isGroupActive = item.children.some((child) => pathname.startsWith(child.path));
        const isOpen = collapsed ? true : (openGroups[item.label] ?? isGroupActive);

        return (
          <div key={item.label}>
            <button
              type="button"
              onClick={() => setOpenGroups((prev) => ({ ...prev, [item.label]: !isOpen }))}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isGroupActive
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate text-left">{item.label}</span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                  />
                </>
              )}
            </button>
            {!collapsed && isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="ml-[22px] flex flex-col gap-0.5 overflow-hidden border-l border-border pl-4"
              >
                {item.children.map((child) => {
                  const isActive = pathname === child.path;
                  return (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      onClick={onNavigate}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "font-medium text-primary bg-primary/5"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {child.label}
                    </NavLink>
                  );
                })}
              </motion.div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export { SidebarNav };

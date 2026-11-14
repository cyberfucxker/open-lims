import { Home, Search, ShoppingCart, ClipboardList, User } from "lucide-react";
import { motion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";

import { useCartStore } from "@/store/cartStore";
import { useCityStore } from "@/store/cityStore";
import { cn } from "@/utils/cn";
import { buildCatalogPath, isCatalogRoute, isHomeRoute } from "@/utils/routes";

/** "Browse" is built per-render in `BottomTabBar` so its `to` can carry the
 *  currently selected city (`buildCatalogPath`), same as `TopNav`'s own
 *  "Tests & Packages" link. */
const STATIC_TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/profile", label: "Profile", icon: User },
];

function BottomTabBar() {
  const location = useLocation();
  const itemCount = useCartStore((s) => s.itemCount);
  const lastAddedAt = useCartStore((s) => s.lastAddedAt);
  const citySlug = useCityStore((s) => s.city?.slug);

  const tabs = [
    STATIC_TABS[0],
    { to: buildCatalogPath("tests", citySlug), label: "Browse", icon: Search },
    ...STATIC_TABS.slice(1),
  ];

  return (
    <nav
      data-testid="bottom-tab-bar"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur-sm md:hidden"
      style={{ height: "var(--bottom-tab-bar-height)" }}
    >
      {tabs.map(({ to, label, icon: Icon }) => {
        const isActive =
          to === "/"
            ? isHomeRoute(location.pathname)
            : to.startsWith("/tests")
              ? isCatalogRoute(location.pathname)
              : location.pathname === to;
        return (
          <NavLink
            key={to}
            to={to}
            aria-label={to === "/cart" && itemCount > 0 ? `${label}, ${itemCount} items` : label}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5"
          >
            <motion.div
              className="relative flex flex-col items-center gap-0.5"
              animate={{ scale: isActive ? 1.08 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "size-6 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                  fill={isActive ? "currentColor" : "none"}
                  fillOpacity={isActive ? 0.15 : 0}
                  strokeWidth={isActive ? 2.25 : 1.9}
                />
                {to === "/cart" && itemCount > 0 && (
                  <motion.span
                    key={lastAddedAt}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </motion.span>
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </motion.div>
          </NavLink>
        );
      })}
    </nav>
  );
}

export { BottomTabBar };

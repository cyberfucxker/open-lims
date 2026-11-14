import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import { BottomTabBar } from "@/components/nav/BottomTabBar";
import { TopNav } from "@/components/nav/TopNav";
import { MobileLocationBar } from "@/components/nav/MobileLocationBar";
import { LeftRail } from "@/components/nav/LeftRail";
import { SiteFooter } from "@/components/home/SiteFooter";
import { AppDownloadWidget } from "@/components/common/AppDownloadWidget";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { SelectCityDialog } from "@/components/location/SelectCityDialog";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { useDefaultCityBootstrap } from "@/hooks/useDefaultCityBootstrap";

const ACCOUNT_ROUTE_PREFIXES = [
  "/profile",
  "/orders",
  "/wallet",
  "/reports",
  "/prescriptions",
  "/addresses",
];

function AppShell() {
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const showLeftRail =
    isDesktop && ACCOUNT_ROUTE_PREFIXES.some((p) => location.pathname.startsWith(p));

  useDefaultCityBootstrap();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav />
      <MobileLocationBar />
      {/* One instance for the whole app — every gated action opens this same
          sheet instead of routing away (see `useAuthGate`). */}
      <AuthDialog />
      {/* Likewise one instance — `LocationPill`, `MobileLocationBar`, and
          `useDefaultCityBootstrap`'s automatic first-visit detection all
          open this same sheet via `cityPickerStore` instead of each owning
          their own copy (a `BottomSheet` portals to `document.body`, so two
          open instances would both render, not just the visible one). */}
      <SelectCityDialog />
      <div className="flex flex-1">
        {showLeftRail && <LeftRail />}
        {/* `md:pb-0!` forced: `.pb-tab-bar` is a plain (non-`@utility`) custom
            class in globals.css, so it lands in the utilities layer AFTER
            Tailwind's own generated `md:pb-0` — same specificity, later
            source order wins, so unmodified `md:pb-0` silently lost and left
            a stray 64px (`--bottom-tab-bar-height`) gap below the footer on
            desktop, where the bar it's clearing space for is hidden anyway. */}
        <main className="min-w-0 flex-1 pb-tab-bar md:pb-0!">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {/* Rendered once here, not per-page, so every route under `AppShell`
          (test/package detail, cart, order detail, account pages, …) gets
          the same footer instead of only the handful of pages that used to
          include it themselves. */}
      <SiteFooter />
      <BottomTabBar />
      {/* Floating bottom-right app-download ticket. Mounted here (not per
          page) so it follows the patient across routes, and self-hides for
          the rest of the session once dismissed. */}
      <AppDownloadWidget />
    </div>
  );
}

export { AppShell };

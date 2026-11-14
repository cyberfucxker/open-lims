import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import {
  ChevronDown,
  FileText,
  Headphones,
  LogOut,
  MapPin,
  ShoppingCart,
  User,
  Wallet as WalletIcon,
  type LucideIcon,
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Logo } from "@/components/brand/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSelectedCityLabel } from "@/hooks/useSelectedCityLabel";
import { useAuthDialogStore } from "@/store/authDialogStore";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useCityPickerStore } from "@/store/cityPickerStore";
import { useCityStore } from "@/store/cityStore";
import { cn } from "@/utils/cn";
import { EASE_OUT_EXPO } from "@/utils/motion";
import { buildCatalogPath, isCatalogRoute, isHomeRoute } from "@/utils/routes";

/** Static entries only — "Tests & Packages" is built per-render in `TopNav`
 *  itself so it can carry the currently selected city (`buildCatalogPath`),
 *  same as `TestCard`/`PackageCard`'s own detail links. */
const STATIC_NAV_LINKS: { to: string; label: string }[] = [
  { to: "/", label: "Home" },
  { to: "/orders", label: "My Bookings" },
  { to: "/reports", label: "Reports" },
  { to: "/about", label: "About Us" },
];

const MENU_LINKS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/profile", label: "My Profile", icon: User },
  { to: "/addresses", label: "Addresses", icon: MapPin },
  { to: "/wallet", label: "Wallet", icon: WalletIcon },
  { to: "/reports", label: "Reports", icon: FileText },
];

const SUPPORT_PHONE = "+91 98765 43210";
const SUPPORT_PHONE_HREF = "tel:+919876543210";

const PILL_SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;
const BADGE_SPRING = { type: "spring", stiffness: 500, damping: 18 } as const;

/** Matches the section, not just the exact path, so a test detail page keeps
 *  "Tests & Packages" lit — the same behaviour NavLink's default matching gave
 *  before. "Home" and "Tests & Packages" each cover more than their own
 *  literal `to` (a city-scoped home URL, and either catalog tab), so those
 *  two go through the shared helpers instead of a plain prefix check. */
function isSectionActive(pathname: string, to: string): boolean {
  if (to === "/") return isHomeRoute(pathname);
  if (to.startsWith("/tests")) return isCatalogRoute(pathname);
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NavItem({ to, label, isActive }: { to: string; label: string; isActive: boolean }) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <NavLink
      to={to}
      className="group relative rounded-xl px-3.5 py-2 outline-none focus-visible:ring-4 focus-visible:ring-ring"
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-xl bg-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />
      {isActive && (
        <motion.span
          aria-hidden
          layoutId="topnav-active-pill"
          transition={reduceMotion ? { duration: 0 } : PILL_SPRING}
          className="absolute inset-0 rounded-xl bg-primary/10 ring-1 ring-primary/20"
        />
      )}
      <span
        className={cn(
          "relative z-10 text-sm font-medium whitespace-nowrap transition-colors duration-200",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        {label}
      </span>
    </NavLink>
  );
}

/** Bordered city chip — same shape as `MobileLocationBar`'s pill, just on
 *  desktop. Prefers the city picked via `SelectCityDialog` (persisted in
 *  `useCityStore`) and falls back to the account's default saved address if
 *  the patient hasn't picked one yet — either is a valid, common state, not
 *  an error. Clicking it opens the picker, not `/addresses`. */
function LocationPill() {
  const openPicker = useCityPickerStore((s) => s.open);
  const city = useSelectedCityLabel();

  return (
    <button
      type="button"
      onClick={() => openPicker()}
      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 outline-none transition-colors hover:bg-accent focus-visible:ring-4 focus-visible:ring-ring"
    >
      <MapPin className="size-4 shrink-0 text-primary" />
      <span className="max-w-28 truncate text-sm font-semibold text-foreground">
        {city ?? "Select location"}
      </span>
      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
    </button>
  );
}

/** Dials out instead of navigating. `compact` drops the "Customer support"
 *  caption down to a single line — used in the section-nav row, which is too
 *  short for the two-line shape `LocationPill` otherwise shares. */
function SupportPill({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <a
      href={SUPPORT_PHONE_HREF}
      aria-label={`Customer support, ${SUPPORT_PHONE}`}
      className={cn(
        "flex items-center gap-2 rounded-xl px-2 py-1 outline-none transition-colors hover:bg-accent focus-visible:ring-4 focus-visible:ring-ring",
        className,
      )}
    >
      <Headphones className="size-4 shrink-0 text-primary" />
      {compact ? (
        <span className="text-sm font-semibold text-foreground tabular-nums">{SUPPORT_PHONE}</span>
      ) : (
        <span className="text-left leading-tight">
          <span className="block text-[11px] text-muted-foreground">Customer support</span>
          <span className="block text-sm font-semibold text-foreground tabular-nums">
            {SUPPORT_PHONE}
          </span>
        </span>
      )}
    </a>
  );
}

function CartButton() {
  const itemCount = useCartStore((s) => s.itemCount);
  const lastAddedAt = useCartStore((s) => s.lastAddedAt);

  return (
    <NavLink
      to="/cart"
      aria-label={itemCount > 0 ? `Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}` : "Cart"}
      className="group relative flex h-10 items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 text-muted-foreground outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-md focus-visible:ring-4 focus-visible:ring-ring"
    >
      <ShoppingCart className="size-[18px]" />
      <span className="hidden text-sm font-medium xl:block">Cart</span>

      <AnimatePresence mode="popLayout">
        {itemCount > 0 && (
          /* Keyed on lastAddedAt so every add-to-cart replays the pop instead of the badge
             sitting still after the first render. */
          <motion.span
            key={`cart-badge-${lastAddedAt}`}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={BADGE_SPRING}
            className="absolute -top-1.5 -right-1.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background"
          >
            {itemCount > 9 ? "9+" : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  );
}

function ProfileMenu() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { name, firstName, mobile, avatarUrl, initials } = useCurrentUser();

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Logged out");
  };

  const avatarFallback = initials ? initials : <User className="size-4" aria-hidden />;

  // Logged out: a plain button matching `CartButton`'s shape, opening the
  // sign-in sheet directly — there's no account menu to show yet, so a
  // dropdown here would just be an empty gesture toward one.
  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() =>
          useAuthDialogStore.getState().open({ reason: "Log in to view your profile" })
        }
        className="group flex h-10 items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 text-muted-foreground outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-md focus-visible:ring-4 focus-visible:ring-ring"
      >
        <User className="size-[18px]" />
        <span className="hidden text-sm font-medium xl:block">Profile</span>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Profile menu"
        className="group flex h-10 items-center gap-2 rounded-xl border border-border/60 bg-card/60 py-1 pr-2 pl-1 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md focus-visible:ring-4 focus-visible:ring-ring data-[state=open]:border-primary/30 data-[state=open]:bg-primary/5"
      >
        <Avatar className="size-8 ring-1 ring-border">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name ?? "Profile photo"} />}
          <AvatarFallback className="bg-primary/10 text-[11px] font-bold text-primary">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-24 truncate text-sm font-semibold xl:block">
          {firstName ?? "Profile"}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-2xl p-2 shadow-xl">
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-2.5">
          <Avatar className="size-10 ring-1 ring-border">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name ?? "Profile photo"} />}
            <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name ?? "Complete your profile"}</p>
            {mobile && (
              <p className="truncate text-xs text-muted-foreground tabular-nums">{mobile}</p>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="my-2" />

        {MENU_LINKS.map(({ to, label, icon: Icon }) => (
          <DropdownMenuItem key={label} asChild>
            <Link to={to} className="gap-2.5 py-2.5 font-medium">
              <Icon className="text-muted-foreground" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="my-1.5" />

        <DropdownMenuItem
          variant="destructive"
          onSelect={handleLogout}
          className="gap-2.5 py-2.5 font-medium"
        >
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Desktop chrome only (`md` and up) — mobile navigation stays with BottomTabBar, and each
 *  page's own sticky PageHeader owns the top edge there. The bar's total height (both rows)
 *  is published as `--top-nav-height` so page-level sticky bars can offset against it.
 *
 *  Two stacked rows: a utility row (logo, location, cart, account, support) and, below it,
 *  the section nav — same split as the reference layout, rather than cramming everything
 *  into one crowded row. */
function TopNav() {
  const location = useLocation();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const citySlug = useCityStore((s) => s.city?.slug);

  useMotionValueEvent(scrollY, "change", (value) => setIsScrolled(value > 8));

  // "Tests & Packages" is inserted here rather than kept in the static list —
  // it's the one entry whose `to` depends on render-time state (the picked
  // city), same reasoning as `TestCard`'s own detail link.
  const navLinks = [
    STATIC_NAV_LINKS[0],
    { to: buildCatalogPath("tests", citySlug), label: "Tests & Packages" },
    ...STATIC_NAV_LINKS.slice(1),
  ];

  return (
    <motion.header
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      style={{ height: "var(--top-nav-height)" }}
      className={cn(
        "sticky top-0 z-40 hidden flex-col bg-background/95 backdrop-blur-xl backdrop-saturate-150 transition-shadow duration-300 md:flex",
        isScrolled ? "shadow-lg shadow-black/[0.06]" : "",
      )}
    >
      {/* Row 1 — utility bar: brand+location on the left, cart/profile on the
          right, matching how competitors (e.g. Redcliffe Labs) split this
          row rather than clustering every pill on one side. */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/60 px-10 lg:px-16 xl:px-24">
        <div className="flex min-w-0 items-center gap-3 lg:gap-5">
          <NavLink
            to="/"
            aria-label="Example Diagnostics Lab — Home"
            className="shrink-0 rounded-lg outline-none transition-transform duration-200 hover:scale-[1.03] focus-visible:ring-4 focus-visible:ring-ring"
          >
            <Logo iconOnly className="h-9 lg:hidden" />
            <Logo className="hidden h-8 lg:block" />
          </NavLink>
          <LocationPill />
        </div>

        <div className="flex items-center gap-1.5 lg:gap-2.5">
          <CartButton />
          <ProfileMenu />
        </div>
      </div>

      {/* Row 2 — section nav. A 3-column grid (not `justify-center` on a flat
          flex row) keeps the links truly centred regardless of the support
          pill's width, rather than off-centre toward the left once it's
          added — see `grid-cols-[1fr_auto_1fr]` below. */}
      <nav
        aria-label="Main"
        className="grid h-11 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-accent/25 px-10 lg:px-16 xl:px-24"
      >
        <div />
        <div className="flex items-center justify-center gap-0.5 lg:gap-1">
          {navLinks.map((link) => (
            <NavItem
              key={link.to}
              to={link.to}
              label={link.label}
              isActive={isSectionActive(location.pathname, link.to)}
            />
          ))}
        </div>
        {/* Sits directly under `ProfileMenu`/`CartButton` above, since both
            rows share the same right-edge padding. Its own `px-3` (up from
            the base pill's `px-2`) keeps it from reading flush against that
            shared edge the way the bare icon+number did at the smaller size. */}
        <SupportPill compact className="hidden justify-self-end px-3 py-1.5 lg:flex" />
      </nav>
    </motion.header>
  );
}

export { TopNav };

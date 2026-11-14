import { Link } from "react-router-dom";
import { Phone, ShoppingBag } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { CONTACT } from "@/components/home/SiteFooter";
import { useCartStore } from "@/store/cartStore";

/** The offer page's own masthead — deliberately not the site's TopNav: an ad
 *  visitor gets the brand, a way to call, and the cart, nothing to wander off to. */
function OfferHeader({ cityName }: { cityName?: string }) {
  const itemCount = useCartStore((s) => s.itemCount);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Link to="/" aria-label="Example Diagnostics Lab — home" className="shrink-0">
          <Logo className="h-7 sm:h-8" />
        </Link>
        {cityName && (
          <span className="hidden border-l border-border pl-3 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:inline">
            {cityName}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <a
            href={CONTACT.phoneHref}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-brand-navy transition-colors hover:bg-secondary"
          >
            <Phone className="size-4" aria-hidden />
            <span className="hidden sm:inline">{CONTACT.phone}</span>
            <span className="sm:hidden">Call</span>
          </a>
          <Link
            to="/cart"
            className="relative flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-brand-navy/40"
            aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
          >
            <ShoppingBag className="size-4" aria-hidden />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground tabular-nums">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

export { OfferHeader };

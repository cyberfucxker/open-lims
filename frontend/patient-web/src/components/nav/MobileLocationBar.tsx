import { Link } from "react-router-dom";
import { ChevronDown, MapPin } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { useSelectedCityLabel } from "@/hooks/useSelectedCityLabel";
import { useCityPickerStore } from "@/store/cityPickerStore";

/** Mobile counterpart to `TopNav` — `TopNav` itself is desktop-only
 *  (`hidden md:flex`), so below `md` there was previously no brand/location
 *  chrome at all. Sticky at the very top, above whatever the page renders
 *  next (mirrors `TopNav`'s sticky behaviour on desktop). Logo sits on the
 *  left as the brand mark; the city picker is its own bordered pill on the
 *  right, mirroring `LocationPill`'s role in the desktop `TopNav`. */
function MobileLocationBar() {
  const openPicker = useCityPickerStore((s) => s.open);
  const city = useSelectedCityLabel();

  return (
    <div className="sticky top-0 z-30 flex w-full items-center justify-between gap-2 border-b border-border bg-background px-4 py-2.5 md:hidden">
      <Link to="/" aria-label="Example Diagnostics Lab — Home" className="shrink-0">
        <Logo className="h-7" />
      </Link>

      <button
        type="button"
        onClick={() => openPicker()}
        className="flex min-w-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 outline-none focus-visible:ring-4 focus-visible:ring-ring"
      >
        <MapPin className="size-3.5 shrink-0 text-primary" />
        <span className="max-w-28 truncate text-sm font-semibold text-foreground">
          {city ?? "Select location"}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </button>
    </div>
  );
}

export { MobileLocationBar };

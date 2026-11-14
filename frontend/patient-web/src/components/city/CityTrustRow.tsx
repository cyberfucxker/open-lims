import { ClipboardCheck, FileText, Package } from "lucide-react";

const TRUST_POINTS = [
  { icon: Package, label: "Home Sample Collection" },
  { icon: FileText, label: "Doctor-Verified Reports" },
  { icon: ClipboardCheck, label: "Certified Labs" },
] as const;

/** The three reassurances a city landing page leads with, sitting in the
 *  masthead where Home puts its "Popular:" search chips.
 *
 *  Someone arriving here came from a search for "lab in Ajmer" and has never
 *  seen this brand before — what they need first is a reason to trust it, not
 *  a shortcut to a test they have not decided on yet. Home's visitor is
 *  usually the opposite: already here on purpose, and better served by the
 *  chips.
 *
 *  Styled for the brand-coloured masthead it now sits on, rather than the
 *  pale band it used to: white on the wash, with the same translucent pill
 *  the chips use so the two rows occupy the space identically. */
function CityTrustRow() {
  return (
    <ul className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6">
      {TRUST_POINTS.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15 text-primary-foreground backdrop-blur-sm">
            <Icon className="size-3.5" />
          </span>
          <span className="text-xs leading-tight font-semibold text-primary-foreground sm:text-[13px]">
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export { CityTrustRow };

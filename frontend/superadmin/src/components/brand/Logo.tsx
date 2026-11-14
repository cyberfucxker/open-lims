import brandIcon from "@/assets/icon.png";
import brandLogo from "@/assets/logo.png";
import { cn } from "@/utils/cn";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

/** Official Example Diagnostics Lab brand mark — same source image as
 *  the main LIMS frontend's Logo (frontend/src/components/brand/Logo.tsx).
 *  `iconOnly` (collapsed sidebar) uses a separately cropped test-tube-only
 *  asset (`icon.png`) rather than CSS-clipping the full lockup,
 *  since the source has no standalone square icon of its own. */
function Logo({ className, iconOnly = false }: LogoProps) {
  if (iconOnly) {
    return (
      <img
        src={brandIcon}
        alt="Example Diagnostics Lab"
        className={cn("h-9 w-auto object-contain", className)}
      />
    );
  }

  return (
    <img
      src={brandLogo}
      alt="Example Diagnostics Lab"
      className={cn("h-8 w-auto object-contain", className)}
    />
  );
}

export { Logo };

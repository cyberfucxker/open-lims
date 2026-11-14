import brandIcon from "@/assets/icon.png";
import brandLogo from "@/assets/logo.png";
import brandLogoWhite from "@/assets/logo-white.png";
import { cn } from "@/utils/cn";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  /** "white" is the all-white wordmark (orange test tubes kept in colour) —
   *  for dark backgrounds like the footer, where it sits directly on the
   *  navy fill instead of needing a white card behind the coloured
   *  ("color") version to stay legible. No white variant of the icon-only
   *  mark exists yet, so `iconOnly` always renders the coloured icon. */
  variant?: "color" | "white";
}

function Logo({ className, iconOnly = false, variant = "color" }: LogoProps) {
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
      src={variant === "white" ? brandLogoWhite : brandLogo}
      alt="Example Diagnostics Lab"
      className={cn("h-8 w-auto object-contain", className)}
    />
  );
}

export { Logo };

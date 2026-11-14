import brandLogo from "@/assets/logo.png";
import { cn } from "@/utils/cn";

interface LogoProps {
  className?: string;
}

/**
 * Official Example Diagnostics Lab brand mark. The source image is a
 * fixed navy-on-transparent lockup, so it should only be placed directly on
 * light surfaces — wrap it in a light chip when it needs to sit on the dark
 * navy hero background (see AuthLayout).
 */
function Logo({ className }: LogoProps) {
  return (
    <img
      src={brandLogo}
      alt="Example Diagnostics Lab"
      className={cn("h-8 w-auto object-contain", className)}
    />
  );
}

export { Logo };

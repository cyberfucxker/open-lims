import type { PropsWithChildren } from "react";

import { BackgroundIllustration } from "@/components/brand/BackgroundIllustration";
import { Logo } from "@/components/brand/Logo";

/**
 * Full-bleed layout for unauthenticated screens (login, forgot password, ...).
 * Renders a navy brand background with a centered content slot.
 */
function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <BackgroundIllustration />

      <div className="absolute top-6 left-6 z-10 rounded-xl bg-white/95 px-4 py-2 shadow-lg sm:top-8 sm:left-8">
        <Logo />
      </div>

      <div className="relative z-10 w-full max-w-md">{children}</div>

      <p className="absolute bottom-6 z-10 text-center text-xs text-white/40">
        &copy; {new Date().getFullYear()} Open LIMS. All rights reserved.
      </p>
    </div>
  );
}

export { AuthLayout };

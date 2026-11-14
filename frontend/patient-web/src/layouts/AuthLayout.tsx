import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import { Logo } from "@/components/brand/Logo";

/** Full-screen, chrome-free layout for login/signup/OTP/forgot-password — each step
 *  transitions via AnimatePresence keyed on pathname so switching steps feels like a
 *  native app screen push, not a page reload. */
function AuthLayout() {
  const location = useLocation();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-5 py-10">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 20% 15%, color-mix(in oklch, var(--primary) 18%, transparent), transparent 55%), radial-gradient(circle at 85% 80%, color-mix(in oklch, var(--brand-teal) 16%, transparent), transparent 55%)",
        }}
      />
      <div className="mb-8">
        <Logo className="h-9" />
      </div>
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export { AuthLayout };

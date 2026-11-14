import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/utils/cn";
import { EASE_OUT_EXPO } from "@/utils/motion";

interface PageHeroProps {
  /** Small trust/status chip above the title — usually a <PageHeroChip>. */
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  /** Primary call-to-action, right-aligned on wide screens. */
  action?: ReactNode;
  /** Content rendered below the title block — stat tiles, an identity card, etc. */
  children?: ReactNode;
  className?: string;
}

/** Premium header band shared by the account-area pages (Bookings / Wallet / Profile).
 *  Carries the dot-matrix + floating-glow treatment established by the marketing
 *  HeroSection so the signed-in surfaces read as the same product. */
function PageHero({ eyebrow, title, description, action, children, className }: PageHeroProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden border-b border-border bg-gradient-to-br from-accent/50 via-background to-background",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 text-primary/10 opacity-40 [background-image:radial-gradient(currentColor_1.5px,transparent_1.5px)] [background-size:26px_26px]"
      />
      <div
        aria-hidden
        className="animate-float-slow absolute -top-24 -left-20 size-64 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-float absolute -right-16 bottom-0 size-64 rounded-full bg-brand-teal/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-5xl px-4 pt-6 pb-6 sm:pt-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="space-y-2"
          >
            {eyebrow}
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
            {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
          </motion.div>

          {action && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: EASE_OUT_EXPO }}
            >
              {action}
            </motion.div>
          )}
        </div>

        {children && <div className="mt-6">{children}</div>}
      </div>
    </header>
  );
}

function PageHeroChip({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
      {icon}
      {children}
    </span>
  );
}

export { PageHero, PageHeroChip };

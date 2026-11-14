import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

/** Fade-and-rise a block into view once it scrolls on-screen. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={revealVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Full-bleed brand-primary hero used across the marketing pages. */
export function MarketingHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="mx-auto max-w-4xl px-4 pt-8 pb-6 text-center sm:pt-10 sm:pb-8">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-xs font-semibold tracking-[0.14em] text-primary uppercase"
      >
        {eyebrow}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl"
      >
        {title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="mx-auto mt-2.5 max-w-xl text-sm leading-relaxed text-muted-foreground"
      >
        {subtitle}
      </motion.p>
    </section>
  );
}

/** Big-number stat card. */
export function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-transform hover:-translate-y-1">
      <p className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

/** Centered section heading with an eyebrow kicker. */
export function SectionHeading({
  kicker,
  title,
  className,
}: {
  kicker?: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("text-center", className)}>
      {kicker && (
        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">{kicker}</p>
      )}
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

import { motion } from "framer-motion";

import { TRUST_BADGES } from "@/mocks/data/homeContent";

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

function TrustBadges() {
  return (
    <section className="mx-auto max-w-7xl px-4">
      <motion.div
        variants={listVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-4 sm:gap-4 sm:p-6"
      >
        {TRUST_BADGES.map((badge) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.id}
              variants={itemVariants}
              className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-lg font-extrabold text-foreground sm:text-xl">{badge.value}</p>
                <p className="text-[11px] leading-tight text-muted-foreground sm:text-xs">
                  {badge.label}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

export { TrustBadges };

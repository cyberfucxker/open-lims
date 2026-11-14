import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { QUICK_ACTIONS } from "@/mocks/data/homeContent";
import type { QuickAction } from "@/mocks/data/homeContent";
import {
  HomeCollectionIllustration,
  LabVisitIllustration,
  NearestLabIllustration,
  OrdersIllustration,
  PrescriptionIllustration,
  ReportsIllustration,
} from "@/components/home/QuickActionIllustrations";
import { cn } from "@/utils/cn";

const QUICK_ACTION_ILLUSTRATIONS: Record<string, typeof HomeCollectionIllustration> = {
  "home-collection": HomeCollectionIllustration,
  "lab-visit": LabVisitIllustration,
  "nearest-lab": NearestLabIllustration,
  reports: ReportsIllustration,
  orders: OrdersIllustration,
  prescription: PrescriptionIllustration,
};

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

/** Alternating left/right rotation per tile on entrance — the little wobble is
 *  what keeps six identical pop-ins from reading as one flat stagger. */
const itemVariants = {
  hidden: (i: number) => ({
    opacity: 0,
    y: 22,
    scale: 0.85,
    rotate: i % 2 === 0 ? -6 : 6,
  }),
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as const },
  },
};

function QuickActions() {
  const navigate = useNavigate();

  function handleClick(action: QuickAction) {
    if (action.comingSoon) {
      toast.info(`${action.label} — coming soon`, {
        description: "This feature is on its way. Stay tuned!",
      });
      return;
    }
    if (action.to) {
      navigate(action.to);
    } else if (action.hash) {
      document.querySelector(action.hash)?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4">
      <motion.div
        variants={listVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        // Mobile: 3-column grid. Desktop/web (sm+): a single row of 6.
        className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3"
      >
        {QUICK_ACTIONS.map((action, i) => {
          const Illustration = QUICK_ACTION_ILLUSTRATIONS[action.id];
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              type="button"
              custom={i}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleClick(action)}
              className="group relative flex flex-col items-center gap-1.5 overflow-hidden rounded-xl border border-border bg-card px-1 py-2.5 text-center shadow-sm transition-all hover:border-primary/30 hover:shadow-lg sm:py-3"
            >
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-4 -top-8 h-16 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30",
                  action.gradient,
                )}
              />
              <motion.span
                className="relative flex size-11 items-center justify-center sm:size-12"
                whileHover={{ scale: 1.12, rotate: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 12 }}
              >
                {Illustration ? (
                  <Illustration className="size-full drop-shadow-sm" />
                ) : (
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md sm:size-10",
                      action.gradient,
                    )}
                  >
                    <Icon className="size-4 sm:size-4.5" />
                  </span>
                )}
              </motion.span>
              <span className="relative px-0.5 text-[10px] leading-snug font-semibold text-foreground sm:text-[11px]">
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}

export { QuickActions };

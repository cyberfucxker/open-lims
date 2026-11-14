import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

interface SuccessAnimationProps {
  open: boolean;
  title: string;
  description?: string;
}

/** Full-panel overlay burst shown briefly after a successful mutation. */
function SuccessAnimation({ open, title, description }: SuccessAnimationProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 rounded-2xl bg-card/95 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.05 }}
            className="relative flex size-20 items-center justify-center rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/30"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0.5, scale: 1 }}
                animate={{ opacity: 0, scale: 1.9 }}
                transition={{
                  duration: 1.1,
                  delay: 0.15 + i * 0.15,
                  repeat: Infinity,
                  repeatDelay: 0.4,
                }}
                className="absolute inset-0 rounded-full border-2 border-emerald-400"
              />
            ))}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              <Check className="size-10 text-white" strokeWidth={3} />
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <p className="text-base font-semibold text-navy-950">{title}</p>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { SuccessAnimation };

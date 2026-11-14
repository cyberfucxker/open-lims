import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

interface HomeFaqItem {
  id: string;
  question: string;
  answer: string;
}

interface HomeFaqSectionProps {
  faqs: HomeFaqItem[];
  isLoading: boolean;
}

/** Hand-rolled accordion (no Radix accordion primitive in this app yet, and
 *  one row of code here isn't worth the new dependency) — single-open,
 *  matching the rest of the home page's icon-badge + heading pattern.
 *  `faqs` arrives already `{city}`-substituted so the visible text and the
 *  `FAQPage` JSON-LD `HomePage.tsx` builds from the same array always match. */
function HomeFaqSection({ faqs, isLoading }: HomeFaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!isLoading && faqs.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl space-y-4 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HelpCircle className="size-4" />
        </span>
        <h2 className="text-lg font-bold text-foreground sm:text-xl">Frequently Asked Questions</h2>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="text-sm font-medium text-foreground sm:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180 text-primary",
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export { HomeFaqSection };

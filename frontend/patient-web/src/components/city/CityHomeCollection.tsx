import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BadgeIndianRupee, CalendarClock, FlaskConical, ShieldCheck, Syringe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildCatalogPath } from "@/utils/routes";

const STEPS = [
  {
    icon: CalendarClock,
    title: "Pick a slot",
    body: "Morning and evening slots, seven days a week — including same-day where the schedule allows.",
  },
  {
    icon: Syringe,
    title: "A phlebotomist comes to you",
    body: "Trained, background-checked, and carrying sealed single-use kits. No clinic queue, no travel.",
  },
  {
    icon: FlaskConical,
    title: "Processed at a certified lab",
    body: "Samples move in temperature-controlled transit to an NABL-accredited lab the same day.",
  },
] as const;

const ASSURANCES = [
  { icon: BadgeIndianRupee, label: "No collection charge on eligible orders" },
  { icon: ShieldCheck, label: "Reports verified by a pathologist before release" },
] as const;

interface CityHomeCollectionProps {
  cityName: string;
  citySlug: string;
}

/** "How home collection works, here" — the section a city landing page needs
 *  and the Home page doesn't. `HowItWorks` on Home explains the product in
 *  the abstract; this answers the local question a visitor actually arrives
 *  with: will someone come to my house, in my city, and when. */
function CityHomeCollection({ cityName, citySlug }: CityHomeCollectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12 lg:p-10">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Home sample collection in {cityName}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Book online, and a trained phlebotomist collects your sample at home anywhere in{" "}
              {cityName}. Reports reach you digitally — no second trip to hand anything over.
            </p>

            <ul className="mt-5 space-y-2.5">
              {ASSURANCES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  {label}
                </li>
              ))}
            </ul>

            <Button asChild className="mt-6 w-full sm:w-auto">
              <Link to={buildCatalogPath("tests", citySlug)}>Book a test in {cityName}</Link>
            </Button>
          </div>

          <ol className="relative space-y-6">
            {/* Connector rail behind the numbered markers — drawn once here
                rather than as a border on each item, so it can't gap at the
                joins when a step's body wraps to a different height. */}
            <span
              aria-hidden
              className="absolute top-5 bottom-5 left-[19px] w-px bg-border sm:left-[23px]"
            />
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                className="relative flex gap-4"
              >
                <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm sm:size-12">
                  <Icon className="size-4.5 sm:size-5" />
                </span>
                <div className="min-w-0 pt-1">
                  <p className="text-[15px] font-bold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export { CityHomeCollection };

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Building2, MapPinned, Network, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { STOCK_IMAGES } from "@/assets/stock";

const NETWORK_STATS = [
  { value: "100+", label: "Network labs" },
  { value: "2500+", label: "Centres" },
  { value: "60+", label: "Cities" },
  { value: "20+", label: "Years experience" },
];

const STATES = [
  "Rajasthan",
  "Uttar Pradesh",
  "Haryana",
  "Punjab",
  "Jammu & Kashmir",
  "Assam",
  "Odisha",
  "Gujarat",
  "Madhya Pradesh",
  "Bihar",
  "Nepal",
];

/** Replaces the old (non-functional) "Download your report" form — that CTA
 *  already lives in My Reports. This showcases the lab network instead and
 *  routes to the real, backend-wired Nearest Lab page. */
function LabsNetworkSection() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl">
        <div
          aria-hidden
          className="animate-gradient-shift absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-brand-teal/20 bg-[length:200%_200%] opacity-60"
        />
        <img
          src={STOCK_IMAGES.labInterior}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity"
        />

        <div className="relative grid grid-cols-1 gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:items-center lg:p-14">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 text-white"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <Network className="size-3.5" />
              100+ Labs Network
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Our 100+ Labs Network
            </h2>
            <p className="max-w-md text-sm text-white/75 sm:text-base">
              Network and reference labs spanning {STATES.length} states and Nepal — so an Example Lab
              lab, and the same trusted quality, is always close by.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {STATES.map((state) => (
                <span
                  key={state}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/85 backdrop-blur-sm"
                >
                  {state}
                </span>
              ))}
            </div>

            <Button
              size="lg"
              className="mt-2 gap-2 shadow-lg shadow-primary/25"
              onClick={() => navigate("/nearby-labs")}
            >
              <MapPinned className="size-5" />
              Find Your Nearest Lab
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel space-y-5 rounded-2xl p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-center gap-2 text-foreground">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-4.5" />
              </span>
              <p className="text-sm font-bold">A network built for reach</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {NETWORK_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-card/60 p-3.5 text-center"
                >
                  <p className="text-xl font-extrabold tracking-tight text-primary sm:text-2xl">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 shrink-0 text-primary" />
              Every network lab follows the same certified quality standards.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export { LabsNetworkSection };

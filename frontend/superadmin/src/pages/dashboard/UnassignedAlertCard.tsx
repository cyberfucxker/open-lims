import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

import type { UnassignedCityRow } from "@/services/api/dashboardSummaryApi";

interface UnassignedAlertCardProps {
  count: number;
  topCities: UnassignedCityRow[];
}

function UnassignedAlertCard({ count, topCities }: UnassignedAlertCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <Link
        to="/orders?filter=unassigned"
        className="group flex h-full flex-col justify-between gap-4 rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-destructive/80">Unassigned Bookings</span>
              <span className="text-[28px] leading-none font-bold tracking-tight text-destructive tabular-nums">
                {count}
              </span>
            </div>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
          </div>

          {topCities.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-destructive/15 pt-3">
              <span className="text-[11px] font-medium text-destructive/70 uppercase">
                Most affected cities
              </span>
              {topCities.map((c) => (
                <div key={c.city} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <MapPin className="size-3.5 text-destructive/60" />
                    {c.city}
                  </span>
                  <span className="font-semibold text-destructive tabular-nums">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 border-t border-destructive/15 pt-3 text-xs font-medium text-destructive">
          Assign phlebotomists now
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </Link>
    </motion.div>
  );
}

export { UnassignedAlertCard };

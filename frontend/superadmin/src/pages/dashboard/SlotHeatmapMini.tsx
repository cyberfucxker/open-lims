import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cities, slotDays } from "@/lib/mock";
import { cn } from "@/utils/cn";

const STATUS_CLASSES: Record<string, string> = {
  available: "bg-success/70",
  partial: "bg-warning/70",
  full: "bg-destructive/70",
  blocked: "bg-muted-foreground/40",
};

function SlotHeatmapMini() {
  const activeCities = cities.filter((c) => c.active).slice(0, 6);
  const days = Array.from({ length: 14 }, (_, i) => i);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-1">
        <CardTitle className="text-base">Slot Utilization — Next 14 Days</CardTitle>
        <Link
          to="/slots"
          className="flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80"
        >
          Manage slots <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="flex flex-col gap-2">
          {activeCities.map((city) => {
            const citySlots = slotDays.filter((d) => d.cityId === city.id).slice(5, 5 + 14);
            return (
              <div key={city.id} className="flex items-center gap-3">
                <span className="w-20 shrink-0 truncate text-xs font-medium text-muted-foreground">
                  {city.name}
                </span>
                <div className="flex flex-1 gap-1">
                  {days.map((d) => {
                    const slot = citySlots[d];
                    return (
                      <div
                        key={d}
                        title={slot ? `${slot.date}: ${slot.status}` : ""}
                        className={cn(
                          "h-4 flex-1 rounded-sm",
                          STATUS_CLASSES[slot?.status ?? "available"],
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-success/70" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-warning/70" /> Partial
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-destructive/70" /> Full
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-muted-foreground/40" /> Blocked
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export { SlotHeatmapMini };

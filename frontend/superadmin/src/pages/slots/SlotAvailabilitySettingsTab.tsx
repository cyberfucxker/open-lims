import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useSlotAvailabilitySettings,
  useUpdateSlotAvailabilitySettings,
} from "@/hooks/queries/useSlotAvailabilitySettings";
import type { SlotAvailabilitySettingsDto } from "@/services/api/slotAvailabilitySettingsApi";

type FlagKey = Exclude<keyof SlotAvailabilitySettingsDto, "updatedAt">;

/** Same 7-step order as the backend waterfall (slotAvailability.service.ts
 *  #resolveSlotAvailability) — each row's toggle controls whether that one
 *  step can ever block a slot. Off (default) means that step is skipped. */
const CONDITIONS: Array<{ key: FlagKey; title: string; description: string }> = [
  {
    key: "checkCityConfigured",
    title: "City configured",
    description: "Block if the city has no active slot template assigned.",
  },
  {
    key: "checkHoliday",
    title: "Holiday",
    description: "Block on a declared holiday for that city and date.",
  },
  {
    key: "checkAreaResolved",
    title: "Area resolved (by pincode)",
    description:
      "Block when the patient's address pincode can't be matched to a service area. Off (default): those addresses still see real, bookable slots for whichever city does cover them.",
  },
  {
    key: "checkAreaBlock",
    title: "Area block",
    description: "Block on a manual block set for this slot in that specific area.",
  },
  {
    key: "checkSlotBlock",
    title: "Slot block",
    description: "Block on a manual, city-wide block set for this slot.",
  },
  {
    key: "checkPhlebotomistCoverage",
    title: "Phlebotomist coverage",
    description: "Block when no active phlebotomist's working hours cover this slot's time.",
  },
  {
    key: "checkCapacity",
    title: "Capacity",
    description: "Block once bookings reach the number of covering phlebotomists.",
  },
];

function RowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3.5">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-5 w-9 rounded-full" />
    </div>
  );
}

function SlotAvailabilitySettingsTab() {
  const settingsQuery = useSlotAvailabilitySettings();
  const settings = settingsQuery.data;
  const updateSettings = useUpdateSlotAvailabilitySettings();

  function handleToggle(key: FlagKey, checked: boolean) {
    updateSettings.mutate(
      { [key]: checked },
      {
        onSuccess: () =>
          toast.success(
            checked
              ? "Condition turned on — now enforced."
              : "Condition turned off — no longer enforced.",
          ),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to update setting."),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-primary/30">
        <CardContent className="flex items-start gap-3 pt-6">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">
              Slot Availability Conditions
            </span>
            <span className="max-w-2xl text-xs text-muted-foreground">
              Each of these is one step in the slot-availability check, in the order they run. Off
              means that step is skipped entirely and can never block a slot — turn a condition on
              only once you want it enforced on live patient booking.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2.5 pt-6">
          {settingsQuery.isLoading || !settings ? (
            <>
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </>
          ) : (
            CONDITIONS.map((condition, index) => (
              <div
                key={condition.key}
                className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3.5"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{condition.title}</span>
                    <span className="max-w-md text-xs text-muted-foreground">
                      {condition.description}
                    </span>
                  </div>
                </div>
                <Switch
                  checked={settings[condition.key]}
                  disabled={updateSettings.isPending}
                  onCheckedChange={(checked) => handleToggle(condition.key, checked)}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { SlotAvailabilitySettingsTab };

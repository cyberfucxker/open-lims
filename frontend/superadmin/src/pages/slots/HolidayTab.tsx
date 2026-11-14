import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { useCities } from "@/hooks/queries/useCitySlotConfig";
import { useDeleteHoliday, useHolidays } from "@/hooks/queries/useHolidays";
import type { HolidayDto } from "@/services/api/holidayApi";

import { HolidayFormDialog } from "./HolidayFormDialog";

const TODAY = format(new Date(), "yyyy-MM-dd");
const DEFAULT_TO = format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

function HolidayTab() {
  const [cityId, setCityId] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState(TODAY);
  const [dateTo, setDateTo] = useState(DEFAULT_TO);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HolidayDto | null>(null);

  const citiesQuery = useCities();
  const cities = citiesQuery.data ?? [];

  const { data, isLoading, isError, error } = useHolidays({ cityId, dateFrom, dateTo });
  const holidays = useMemo(
    () => [...(data ?? [])].sort((a, b) => a.holidayDate.localeCompare(b.holidayDate)),
    [data],
  );

  const deleteHoliday = useDeleteHoliday();

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteHoliday.mutate(target.id, {
      onSuccess: () => {
        toast.success("Holiday removed.");
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to remove holiday.");
        setDeleteTarget(null);
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="flex flex-col gap-1.5">
            <Label>City</Label>
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <Button className="ml-auto" onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Add Holiday
          </Button>
        </CardContent>
      </Card>

      {!cityId ? (
        <EmptyState
          icon={CalendarOff}
          title="Select a city"
          description="Choose a city above to view and manage its holidays."
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={CalendarOff}
          title="Couldn't load holidays"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : holidays.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="No holidays in this range"
          description="No holidays are configured for this city and date range."
          action={
            <Button onClick={() => setFormOpen(true)} variant="outline" size="sm">
              <Plus className="size-3.5" />
              Add Holiday
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <CalendarOff className="size-4" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {formatDate(holiday.holidayDate)}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {holiday.cityName} · {holiday.reason}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteTarget(holiday)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <HolidayFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        cities={cities}
        defaultCityId={cityId}
        defaultDate={TODAY}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove holiday?"
        description={`${
          deleteTarget ? formatDate(deleteTarget.holidayDate) : "This date"
        } will become bookable again.`}
        confirmLabel="Remove"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { HolidayTab };

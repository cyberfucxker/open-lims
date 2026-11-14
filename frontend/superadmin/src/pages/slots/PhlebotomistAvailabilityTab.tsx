import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Syringe } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCities, useCitySlotConfig } from "@/hooks/queries/useCitySlotConfig";
import { usePhlebotomistSlotStatus } from "@/hooks/queries/usePhlebotomistSlotStatus";

const TODAY = format(new Date(), "yyyy-MM-dd");

function formatWorkingHours(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  return `${start} - ${end}`;
}

function PhlebotomistAvailabilityTab() {
  const [cityId, setCityId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(TODAY);

  const citiesQuery = useCities();
  const cities = citiesQuery.data ?? [];

  const configQuery = useCitySlotConfig(cityId);
  const titleByTemplateId = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of configQuery.data?.templates ?? []) map.set(t.slotTemplateId, t.title);
    return map;
  }, [configQuery.data]);

  const { data, isLoading, isError, error } = usePhlebotomistSlotStatus({ cityId, date });
  const rows = data ?? [];

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
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {!cityId ? (
        <EmptyState
          icon={Syringe}
          title="Select a city"
          description="Choose a city and date above to view phlebotomist availability."
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Syringe}
          title="Couldn't load phlebotomist availability"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Syringe}
          title="No phlebotomists found"
          description="No active phlebotomists are assigned to this city."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Phlebotomist</TableHead>
                <TableHead>Working Hours</TableHead>
                <TableHead>Assigned Areas</TableHead>
                <TableHead>Today's Bookings</TableHead>
                <TableHead>Available Slots</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.phlebotomistId}>
                  <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatWorkingHours(row.workingHoursStart, row.workingHoursEnd)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.assignedAreas.length === 0 ? (
                        <span className="text-xs text-muted-foreground">None</span>
                      ) : (
                        row.assignedAreas.map((a) => (
                          <Badge key={a.id} variant="secondary">
                            {a.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{row.todaysBookings}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.availableSlotTemplateIds.length === 0 ? (
                        <span className="text-xs text-muted-foreground">None</span>
                      ) : (
                        row.availableSlotTemplateIds.map((id) => (
                          <Badge key={id} variant="outline">
                            {titleByTemplateId.get(id) ?? id}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export { PhlebotomistAvailabilityTab };

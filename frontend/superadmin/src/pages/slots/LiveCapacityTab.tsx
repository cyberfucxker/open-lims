import { useState } from "react";
import { format } from "date-fns";
import { Gauge, MapPinned } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCities } from "@/hooks/queries/useCitySlotConfig";
import { useLiveCapacity } from "@/hooks/queries/useLiveCapacity";

import { to12Hour } from "./slotFormat";

const TODAY = format(new Date(), "yyyy-MM-dd");

function LiveCapacityTab() {
  const [cityId, setCityId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(TODAY);

  const citiesQuery = useCities();
  const cities = citiesQuery.data ?? [];

  const { data, isLoading, isError, error } = useLiveCapacity({ cityId, date });
  const areas = data ?? [];

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
          icon={Gauge}
          title="Select a city"
          description="Choose a city and date above to view live booking capacity per area."
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Gauge}
          title="Couldn't load live capacity"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : areas.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="No areas found"
          description="This city has no areas configured yet."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {areas.map((area) => (
            <Card key={area.areaId}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPinned className="size-4 text-muted-foreground" />
                  {area.areaName}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {area.slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No slot templates assigned.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Slot</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Booked</TableHead>
                          <TableHead>Remaining</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {area.slots.map((slot) => {
                          const remaining = Math.max(0, slot.capacity - slot.booked);
                          return (
                            <TableRow key={slot.slotTemplateId}>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-medium text-foreground">{slot.title}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {to12Hour(slot.startTime)} – {to12Hour(slot.endTime)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="tabular-nums">{slot.capacity}</TableCell>
                              <TableCell className="tabular-nums">{slot.booked}</TableCell>
                              <TableCell className="tabular-nums">{remaining}</TableCell>
                              <TableCell>
                                {slot.isBlocked ? (
                                  slot.blockReason ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="destructive">Blocked</Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>{slot.blockReason}</TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <Badge variant="destructive">Blocked</Badge>
                                  )
                                ) : remaining <= 0 ? (
                                  <Badge variant="warning">Full</Badge>
                                ) : (
                                  <Badge variant="success">Available</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export { LiveCapacityTab };

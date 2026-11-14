import { useState } from "react";
import { IndianRupee, MapPinned } from "lucide-react";
import { toast } from "sonner";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAreas, useSetAreaPhlebotomyCharge } from "@/hooks/queries/useAreas";
import { useCities, useSetCityPhlebotomyCharge } from "@/hooks/queries/useCitySlotConfig";
import type { AreaDto } from "@/services/api/areaApi";
import type { SlotSystemCityDto } from "@/services/api/citySlotConfigApi";

function ChargeCell({
  value,
  placeholder,
  onSave,
  isSaving,
}: {
  value: number | null;
  placeholder: string;
  onSave: (value: number | null) => void;
  isSaving: boolean;
}) {
  const [draft, setDraft] = useState(value === null ? "" : String(value));
  const dirty = draft !== (value === null ? "" : String(value));

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-28">
        <IndianRupee className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="number"
          min={0}
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-8 pl-7"
        />
      </div>
      {dirty && (
        <Button
          size="sm"
          className="h-8"
          disabled={isSaving}
          onClick={() => {
            const trimmed = draft.trim();
            onSave(trimmed === "" ? null : Number(trimmed));
          }}
        >
          Save
        </Button>
      )}
    </div>
  );
}

function CityChargesSection({
  cities,
  isLoading,
}: {
  cities: SlotSystemCityDto[];
  isLoading: boolean;
}) {
  const setCityCharge = useSetCityPhlebotomyCharge();

  function handleSave(city: SlotSystemCityDto, value: number | null) {
    if (value === null) {
      toast.error("City base charge can't be cleared — enter an amount.");
      return;
    }
    setCityCharge.mutate(
      { cityId: city.id, phlebotomyCharge: value },
      {
        onSuccess: () => toast.success(`Base phlebotomy charge for ${city.name} updated.`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to update charge."),
      },
    );
  }

  const columns: DataTableColumn<SlotSystemCityDto>[] = [
    {
      key: "name",
      header: "City",
      render: (c) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{c.name}</span>
          <span className="text-xs text-muted-foreground">{c.stateName}</span>
        </div>
      ),
    },
    {
      key: "charge",
      header: "Base Charge (₹)",
      render: (c) => (
        <ChargeCell
          value={c.phlebotomyCharge}
          placeholder="100"
          isSaving={setCityCharge.isPending}
          onSave={(value) => handleSave(c, value)}
        />
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">City Base Charges</CardTitle>
        <p className="text-xs text-muted-foreground">
          Default phlebotomy/sample-collection charge applied at checkout for each city. Defaults to
          ₹100 until changed.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ) : cities.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            title="No cities found"
            description="Add a city from Slot Management first."
          />
        ) : (
          <DataTable columns={columns} data={cities} rowKey={(c) => c.id} pageSize={8} />
        )}
      </CardContent>
    </Card>
  );
}

function AreaChargesSection({
  areas,
  isLoading,
  cityBaseByCityId,
}: {
  areas: AreaDto[];
  isLoading: boolean;
  cityBaseByCityId: Map<string, number>;
}) {
  const setAreaCharge = useSetAreaPhlebotomyCharge();

  function handleSave(area: AreaDto, value: number | null) {
    setAreaCharge.mutate(
      { id: area.id, phlebotomyCharge: value },
      {
        onSuccess: () =>
          toast.success(
            value === null
              ? `"${area.name}" now inherits its city's base charge.`
              : `Phlebotomy charge override for "${area.name}" updated.`,
          ),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to update charge."),
      },
    );
  }

  const columns: DataTableColumn<AreaDto>[] = [
    {
      key: "name",
      header: "Area",
      render: (a) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{a.name}</span>
          <span className="text-xs text-muted-foreground">{a.cityName}</span>
        </div>
      ),
    },
    {
      key: "charge",
      header: "Override (₹)",
      render: (a) => (
        <ChargeCell
          value={a.phlebotomyCharge}
          placeholder={`Inherits ₹${cityBaseByCityId.get(a.cityId) ?? 100}`}
          isSaving={setAreaCharge.isPending}
          onSave={(value) => handleSave(a, value)}
        />
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Area Overrides</CardTitle>
        <p className="text-xs text-muted-foreground">
          Leave blank to inherit the city's base charge. Set a value to override it for that
          specific area, clear it to go back to inheriting.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ) : areas.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            title="No areas found"
            description="Add an area from Slot Management first."
          />
        ) : (
          <DataTable columns={columns} data={areas} rowKey={(a) => a.id} pageSize={8} />
        )}
      </CardContent>
    </Card>
  );
}

function PhlebotomyChargesTab() {
  const citiesQuery = useCities();
  const cities = citiesQuery.data ?? [];

  const areasQuery = useAreas({ page: 1, pageSize: 200 });
  const areas = areasQuery.data?.rows ?? [];

  const cityBaseByCityId = new Map(cities.map((c) => [c.id, c.phlebotomyCharge]));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        These charges apply to orders placed under the new Slot Template system (see the{" "}
        <span className="font-medium">Slots</span> page's City Config tab for cutover status).
        Cities not yet cut over keep their existing per-slot pricing, unaffected by this section.
      </p>

      <CityChargesSection cities={cities} isLoading={citiesQuery.isLoading} />
      <AreaChargesSection
        areas={areas}
        isLoading={areasQuery.isLoading}
        cityBaseByCityId={cityBaseByCityId}
      />
    </div>
  );
}

export { PhlebotomyChargesTab };

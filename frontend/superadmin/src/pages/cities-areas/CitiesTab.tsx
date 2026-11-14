import { useState } from "react";
import { Building2, MapPinned, Pencil, Plus, Star } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useCityList, useSetCityStatus } from "@/hooks/queries/useCityMaster";
import type { CityDto } from "@/services/api/cityApi";

import { CityFormDialog } from "./CityFormDialog";

/** The City master list — create/edit/deactivate. Deactivating (not a real
 *  delete — `City` has no soft-delete column, and one already has real
 *  activity — appUsers, prescriptions, franchises, areas — the moment it's
 *  live) is how a city is "removed": it drops out of the app's location
 *  picker and, on the backend, out of the live sitemap (see
 *  `sitemapGenerator.service.ts`) without breaking anything already
 *  pointing at it. */
function CitiesTab() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityDto | null>(null);

  const citiesQuery = useCityList({ search: search.trim() || undefined, active: "all" });
  const setStatus = useSetCityStatus();
  const cities = citiesQuery.data?.rows ?? [];

  function handleToggleActive(city: CityDto) {
    setStatus.mutate(
      { id: city.id, active: !city.isActive },
      {
        onSuccess: () => {
          toast.success(`${city.name} marked as ${!city.isActive ? "active" : "inactive"}.`);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update status.");
        },
      },
    );
  }

  const columns: DataTableColumn<CityDto>[] = [
    {
      key: "name",
      header: "Name",
      render: (city) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-4" />
          </div>
          <span className="font-medium text-foreground">{city.name}</span>
          {city.isFeatured && (
            <Badge variant="outline" className="gap-1 text-amber-600">
              <Star className="size-3 fill-current" />
              Featured
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "state",
      header: "State",
      render: (city) => <span className="text-muted-foreground">{city.stateName}</span>,
    },
    {
      key: "slug",
      header: "URL slug",
      render: (city) => (
        <span className="font-mono text-xs text-muted-foreground">/{city.slug}</span>
      ),
    },
    {
      key: "active",
      header: "Active",
      render: (city) => (
        <Switch checked={city.isActive} onCheckedChange={() => handleToggleActive(city)} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (city) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              setEditingCity(city);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <div className="min-w-[220px] flex-1">
            <Input
              placeholder="Search by city or state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setEditingCity(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add City
            </Button>
          </div>
        </CardContent>
      </Card>

      {citiesQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ) : citiesQuery.isError ? (
        <EmptyState
          icon={Building2}
          title="Couldn't load cities"
          description={
            citiesQuery.error instanceof Error ? citiesQuery.error.message : "Something went wrong."
          }
        />
      ) : cities.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="No cities found"
          description="Try a different search, or add a new city."
          action={
            <Button
              onClick={() => {
                setEditingCity(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add City
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={cities} rowKey={(row) => row.id} pageSize={20} />
      )}

      <CityFormDialog open={formOpen} onOpenChange={setFormOpen} city={editingCity} />
    </div>
  );
}

export { CitiesTab };

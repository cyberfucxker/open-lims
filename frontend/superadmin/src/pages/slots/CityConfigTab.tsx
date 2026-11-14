import { useEffect, useState } from "react";
import { Building2, ShieldAlert, Star } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useAssignCitySlotTemplates,
  useCities,
  useCitySlotConfig,
  useSetCityCutover,
  useSetCityParentOrganization,
} from "@/hooks/queries/useCitySlotConfig";
import { useOrganizations } from "@/hooks/queries/useOrganizations";

import { to12Hour } from "./slotFormat";

const NO_PARENT = "__none__";

function CityConfigTab() {
  const [cityId, setCityId] = useState<string | undefined>(undefined);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [cutoverConfirmOpen, setCutoverConfirmOpen] = useState(false);
  const [pendingCutover, setPendingCutover] = useState<boolean | null>(null);

  const citiesQuery = useCities();
  const cities = citiesQuery.data ?? [];
  const selectedCity = cities.find((c) => c.id === cityId);

  const configQuery = useCitySlotConfig(cityId);
  const config = configQuery.data;

  // Only franchises already assigned to this city are offered — a franchise
  // can't become this city's parent by surprise (see the backend's matching
  // check in `citySlotConfig.service.ts#setCityParentOrganization`).
  const franchisesQuery = useOrganizations({
    cityId,
    active: "true",
    pageSize: 100,
  });
  const franchises = franchisesQuery.data?.rows ?? [];

  useEffect(() => {
    if (config) {
      setCheckedIds(config.templates.filter((t) => t.assigned).map((t) => t.slotTemplateId));
    }
  }, [config]);

  const assignTemplates = useAssignCitySlotTemplates();
  const setCutover = useSetCityCutover();
  const setParentOrganization = useSetCityParentOrganization();

  function toggleTemplate(id: string, checked: boolean) {
    setCheckedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  function handleParentOrganizationChange(value: string) {
    if (!cityId) return;
    setParentOrganization.mutate(
      { cityId, organizationId: value === NO_PARENT ? null : value },
      {
        onSuccess: () =>
          toast.success(
            value === NO_PARENT
              ? "Parent franchise cleared — this city now shows the full catalogue."
              : "Parent franchise updated.",
          ),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to update parent franchise."),
      },
    );
  }

  function handleSaveAssignment() {
    if (!cityId) return;
    assignTemplates.mutate(
      { cityId, slotTemplateIds: checkedIds },
      {
        onSuccess: () => toast.success("Slot template assignment saved."),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to save assignment."),
      },
    );
  }

  function requestCutoverChange(next: boolean) {
    setPendingCutover(next);
    setCutoverConfirmOpen(true);
  }

  function confirmCutoverChange() {
    if (!cityId || pendingCutover === null) return;
    setCutover.mutate(
      { cityId, useNewSlotSystem: pendingCutover },
      {
        onSuccess: () => {
          toast.success(
            pendingCutover
              ? "This city is now on the new slot system."
              : "This city has been switched back to the old slot system.",
          );
          setCutoverConfirmOpen(false);
          setPendingCutover(null);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update cutover.");
          setCutoverConfirmOpen(false);
          setPendingCutover(null);
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <span className="text-sm font-medium text-muted-foreground">City</span>
          <Select value={cityId} onValueChange={setCityId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a city to configure" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                  {city.useNewSlotSystem ? " (new system)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!cityId ? (
        <EmptyState
          icon={Building2}
          title="Select a city"
          description="Choose a city above to manage its assigned slot templates and slot-system cutover."
        />
      ) : configQuery.isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : configQuery.isError ? (
        <EmptyState
          icon={Building2}
          title="Couldn't load city configuration"
          description={
            configQuery.error instanceof Error ? configQuery.error.message : "Something went wrong."
          }
        />
      ) : config ? (
        <>
          <Card className="border-primary/30">
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Star className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">Parent Franchise</span>
                  <span className="max-w-lg text-xs text-muted-foreground">
                    This franchise's price list decides which tests, packages and parameters
                    patients see — and at what price — when browsing {config.cityName} on the app.
                    Every other franchise assigned to this city just fulfils orders; its own prices
                    have no effect on the app.
                  </span>
                </div>
              </div>

              <Select
                value={selectedCity?.parentOrganizationId ?? NO_PARENT}
                onValueChange={handleParentOrganizationChange}
                disabled={setParentOrganization.isPending}
              >
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue placeholder="No parent set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>No parent — show full catalogue</SelectItem>
                  {franchises.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!franchisesQuery.isLoading && franchises.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No franchises are assigned to {config.cityName} yet — assign one from
                  Organizations first, then come back here to make it the parent.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    Assigned Slot Templates
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Check the slot templates bookable in {config.cityName}.
                  </span>
                </div>
                <Button
                  onClick={handleSaveAssignment}
                  disabled={assignTemplates.isPending}
                  size="sm"
                >
                  {assignTemplates.isPending ? "Saving..." : "Save Assignment"}
                </Button>
              </div>

              {config.templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No slot templates exist yet — create one in the Slot Templates tab first.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {config.templates.map((t) => (
                    <label
                      key={t.slotTemplateId}
                      className="flex items-center gap-2.5 rounded-xl border border-border px-3.5 py-2.5 text-sm"
                    >
                      <Checkbox
                        checked={checkedIds.includes(t.slotTemplateId)}
                        onCheckedChange={(checked) =>
                          toggleTemplate(t.slotTemplateId, checked === true)
                        }
                      />
                      <span className="flex-1 text-foreground">{t.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {to12Hour(t.startTime)} – {to12Hour(t.endTime)}
                      </span>
                      {!t.active && (
                        <Badge variant="secondary" className="text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={config.useNewSlotSystem ? "border-success/40" : "border-warning/40"}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <div className="flex items-start gap-3">
                <div
                  className={
                    config.useNewSlotSystem
                      ? "flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success"
                      : "flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning"
                  }
                >
                  <ShieldAlert className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    Use New Slot System for {config.cityName}
                  </span>
                  <span className="max-w-md text-xs text-muted-foreground">
                    This affects live patient-facing booking traffic immediately. Requires at least
                    one slot template assigned.
                  </span>
                </div>
              </div>
              <Switch
                checked={config.useNewSlotSystem}
                disabled={setCutover.isPending}
                onCheckedChange={(checked) => requestCutoverChange(checked)}
              />
            </CardContent>
          </Card>
        </>
      ) : null}

      <ConfirmDialog
        open={cutoverConfirmOpen}
        onOpenChange={(open) => {
          setCutoverConfirmOpen(open);
          if (!open) setPendingCutover(null);
        }}
        title={pendingCutover ? "Switch to new slot system?" : "Switch back to old slot system?"}
        description={
          pendingCutover
            ? "This city's live patient booking will immediately start using slot templates and area-based capacity instead of the legacy system."
            : "This city's live patient booking will immediately fall back to the legacy slot system."
        }
        confirmLabel={pendingCutover ? "Switch to new system" : "Switch back"}
        destructive={!pendingCutover}
        onConfirm={confirmCutoverChange}
      />
    </div>
  );
}

export { CityConfigTab };

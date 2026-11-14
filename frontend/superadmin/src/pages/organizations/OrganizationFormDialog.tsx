import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useAreas } from "@/hooks/queries/useAreas";
import {
  useCityOptions,
  useCreateOrganization,
  useOrganizationServiceAreas,
  useSetOrganizationServiceAreas,
  useUpdateOrganization,
} from "@/hooks/queries/useOrganizations";
import type { FranchiseType, Organization, PriceListOption } from "@/services/api/organizationApi";

import { deriveFranchiseCodeBase } from "./franchiseCode";

interface OrganizationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceLists: PriceListOption[];
  /** Present = edit this franchise; absent/null = create a new one. */
  organization?: Organization | null;
}

const FRANCHISE_TYPE_OPTIONS: { value: FranchiseType; label: string; hint: string }[] = [
  { value: "SINGLE_LAB", label: "Single Lab", hint: "Uses Example Diagnostics Lab branding" },
  { value: "CO_LAB", label: "Co-Lab", hint: "Uses this franchise's own lab name and logo" },
];

/** Mirrors the backend policy: 8+ chars with upper, lower, digit and symbol. */
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** City-scoped Area checklist — reused by create and edit. Re-fetches
 *  whenever `cityId` changes, so picking a different city always shows that
 *  city's own areas ("city ke according area aayenge"). The caller is
 *  responsible for clearing `selectedIds` when `cityId` changes, since a
 *  franchise picked for one city genuinely shouldn't keep another city's
 *  area ids selected once they've scrolled out of view. */
function AreaChecklist({
  cityId,
  selectedIds,
  onChange,
}: {
  cityId: string | undefined;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const areasQuery = useAreas({ cityId, isActive: true, pageSize: 200 });
  const areas = areasQuery.data?.rows ?? [];
  const visible = search.trim()
    ? areas.filter((a) => a.name.toLowerCase().includes(search.trim().toLowerCase()))
    : areas;
  const selected = new Set(selectedIds);

  function toggle(areaId: string) {
    onChange(
      selected.has(areaId) ? selectedIds.filter((id) => id !== areaId) : [...selectedIds, areaId],
    );
  }

  if (!cityId) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Select a city above to see its areas.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search areas…"
        className="h-9"
      />
      <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-card p-2">
        {areasQuery.isLoading ? (
          <div className="flex flex-col gap-2 p-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full rounded-lg" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="p-3 text-center text-sm text-muted-foreground">
            {search ? "No area matches your search." : "No areas configured for this city yet."}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {visible.map((area) => (
              <li key={area.id}>
                <label className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent">
                  <Checkbox
                    checked={selected.has(area.id)}
                    onCheckedChange={() => toggle(area.id)}
                  />
                  <span className="flex-1 truncate text-foreground">{area.name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {selectedIds.length} area{selectedIds.length === 1 ? "" : "s"} selected — orders placed for
        any of these route to this franchise.
      </p>
    </div>
  );
}

function OrganizationFormDialog({
  open,
  onOpenChange,
  priceLists,
  organization = null,
}: OrganizationFormDialogProps) {
  const isEdit = organization !== null;

  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [franchiseType, setFranchiseType] = useState<FranchiseType>("SINGLE_LAB");
  const [cityId, setCityId] = useState<string | undefined>(undefined);
  const [priceListId, setPriceListId] = useState<string | undefined>(undefined);
  const [commissionPct, setCommissionPct] = useState("0");
  const [areaIds, setAreaIds] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [labName, setLabName] = useState("");

  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();
  const setServiceAreasMutation = useSetOrganizationServiceAreas();
  const { data: cities, isLoading: citiesLoading } = useCityOptions();
  const assignedAreasQuery = useOrganizationServiceAreas(isEdit ? organization!.id : undefined);

  const codePreview = useMemo(() => deriveFranchiseCodeBase(name), [name]);
  const isSaving =
    createMutation.isPending || updateMutation.isPending || setServiceAreasMutation.isPending;

  // `priceLists` is templates only (`ownership: "template"`), but an
  // already-assigned franchise's `priceListId` is its own private CLONE id
  // (clone-on-assign — see `organization.repository.ts#cloneAndAssignPriceList`),
  // which never appears in the template list. Without this the Select below
  // can't find a matching item and renders blank even though a price list
  // *is* assigned — same fix as `OrganizationDetailDrawer`'s read-only view.
  const priceListSelectOptions = useMemo(() => {
    if (!organization?.priceListId) return priceLists;
    if (priceLists.some((pl) => pl.id === organization.priceListId)) return priceLists;
    return [
      { id: organization.priceListId, name: organization.priceListName ?? "Current price list" },
      ...priceLists,
    ];
  }, [priceLists, organization?.priceListId, organization?.priceListName]);

  useEffect(() => {
    if (!open) return;
    if (organization) {
      setName(organization.name);
      setOwnerName(organization.contactPerson ?? "");
      setMobile(organization.mobile);
      setEmail(organization.email ?? "");
      setFranchiseType(organization.franchiseType);
      setCityId(organization.cityId ?? undefined);
      setPriceListId(organization.priceListId ?? undefined);
      setCommissionPct(String(organization.commissionPct));
      setLabName(organization.labName ?? "");
    } else {
      setName("");
      setOwnerName("");
      setMobile("");
      setEmail("");
      setFranchiseType("SINGLE_LAB");
      setCityId(undefined);
      setPriceListId(undefined);
      setCommissionPct("0");
      setAreaIds([]);
      setLabName("");
    }
    setUsername("");
    setPassword("");
    // `areaIds` for edit mode is set by the effect below once the assigned-
    // areas query resolves — not here, since it depends on a fetch.
  }, [open, organization]);

  useEffect(() => {
    if (open && organization && assignedAreasQuery.data) {
      setAreaIds(assignedAreasQuery.data.map((a) => a.id));
    }
  }, [open, organization, assignedAreasQuery.data]);

  function handleCityChange(nextCityId: string) {
    // Cascading reset: a franchise's areas belong to its city, so switching
    // city drops whatever was selected for the previous one rather than
    // silently keeping now-invisible area ids around to submit.
    if (nextCityId !== cityId) setAreaIds([]);
    setCityId(nextCityId);
  }

  function validate(): string | null {
    if (!name.trim()) return "Franchise name is required.";
    if (!mobile.trim()) return "Mobile number is required.";
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid email address.";
    if (!isEdit) {
      if (!priceListId) return "Select an initial price list.";
      if (!username.trim()) return "Username is required.";
      if (username.trim().length < 3) return "Username must be at least 3 characters.";
      if (!PASSWORD_POLICY_REGEX.test(password)) {
        return "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";
      }
    }
    const pct = Number(commissionPct);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) return "Commission % must be between 0 and 100.";
    if (franchiseType === "CO_LAB" && !labName.trim()) {
      return "A Co-Lab franchise needs a lab name for its reports and invoices.";
    }
    return null;
  }

  function handleSubmit() {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    if (isEdit) {
      updateMutation.mutate(
        {
          id: organization!.id,
          values: {
            name: name.trim(),
            type: organization!.type,
            contactPerson: ownerName.trim() || undefined,
            mobile: mobile.trim(),
            email: email.trim() || undefined,
            franchiseType,
            cityId,
            // `priceListId` on this endpoint always names a TEMPLATE to clone
            // from — never a list to point at directly (see
            // `organization.service.ts#updateOrganization`'s doc-comment).
            // `priceListId` state here is seeded from the org's own CLONE id
            // (so the Select displays correctly — see `priceListSelectOptions`
            // above), so it must only be sent when the admin actually picked a
            // *different* value; sending the unchanged clone id back would
            // make the backend try to re-clone from a list that isn't a
            // template and fail with "Selected price list does not exist."
            priceListId: priceListId !== organization!.priceListId ? priceListId : undefined,
            commissionPct: Number(commissionPct),
            labName: franchiseType === "CO_LAB" ? labName.trim() : undefined,
          },
        },
        {
          onSuccess: () => {
            setServiceAreasMutation.mutate(
              { id: organization!.id, areaIds },
              {
                onSuccess: () => {
                  toast.success(`"${organization!.name}" updated.`);
                  onOpenChange(false);
                },
                onError: (err) =>
                  toast.error(
                    errorMessage(err, "Franchise saved, but service areas failed to update"),
                  ),
              },
            );
          },
          onError: (err) => toast.error(errorMessage(err, "Failed to update franchise")),
        },
      );
      return;
    }

    createMutation.mutate(
      {
        name: name.trim(),
        contactPerson: ownerName.trim() || undefined,
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        franchiseType,
        cityId,
        priceListId,
        commissionPct: Number(commissionPct),
        labName: franchiseType === "CO_LAB" ? labName.trim() : undefined,
        username: username.trim(),
        password,
      },
      {
        onSuccess: (created) => {
          if (areaIds.length === 0) {
            toast.success(`Franchise "${created.name}" created — code ${created.code}.`);
            onOpenChange(false);
            return;
          }
          setServiceAreasMutation.mutate(
            { id: created.id, areaIds },
            {
              onSuccess: () => {
                toast.success(`Franchise "${created.name}" created — code ${created.code}.`);
                onOpenChange(false);
              },
              onError: (err) =>
                toast.error(
                  errorMessage(err, "Franchise created, but service areas failed to save"),
                ),
            },
          );
        },
        onError: (err) => toast.error(errorMessage(err, "Failed to create franchise")),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${organization!.name}` : "Add Franchise"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this franchise's details, city, price list and service areas."
              : "Onboard a franchise and create its portal login in one step."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Franchise Name" htmlFor="fr-name">
              <Input
                id="fr-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Example Diagnostics Lab Jaipur"
              />
            </Field>
            {isEdit ? (
              <Field label="Franchise Code" htmlFor="fr-code">
                <Input
                  id="fr-code"
                  value={organization!.code}
                  readOnly
                  disabled
                  className="font-mono tracking-wider"
                />
              </Field>
            ) : (
              <Field
                label="Franchise Code"
                htmlFor="fr-code"
                hint="Generated from the name. A number is appended if it is already taken."
              >
                <Input
                  id="fr-code"
                  value={codePreview}
                  readOnly
                  disabled
                  placeholder="Auto-generated"
                  className="font-mono tracking-wider"
                />
              </Field>
            )}

            <Field label="Owner Name" htmlFor="fr-owner">
              <Input
                id="fr-owner"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Owner / contact person"
              />
            </Field>
            <Field label="Mobile Number" htmlFor="fr-mobile">
              <Input
                id="fr-mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="9876543210"
                inputMode="numeric"
              />
            </Field>

            <Field label="Email" htmlFor="fr-email">
              <Input
                id="fr-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
              />
            </Field>
            <Field
              label="Franchise Type"
              htmlFor="fr-type"
              hint={FRANCHISE_TYPE_OPTIONS.find((o) => o.value === franchiseType)?.hint}
            >
              <Select
                value={franchiseType}
                onValueChange={(v) => setFranchiseType(v as FranchiseType)}
              >
                <SelectTrigger id="fr-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FRANCHISE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="City" htmlFor="fr-city">
              <Select value={cityId} onValueChange={handleCityChange} disabled={citiesLoading}>
                <SelectTrigger id="fr-city" className="w-full">
                  <SelectValue placeholder={citiesLoading ? "Loading…" : "Select city"} />
                </SelectTrigger>
                <SelectContent>
                  {(cities ?? []).map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                      <span className="ml-1.5 text-xs text-muted-foreground">{city.stateName}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              label={isEdit ? "Price List" : "Initial Price List"}
              htmlFor="fr-price-list"
              hint="A private copy is created for this franchise — editing it never affects another."
            >
              <Select value={priceListId} onValueChange={setPriceListId}>
                <SelectTrigger id="fr-price-list" className="w-full">
                  <SelectValue placeholder="Select price list" />
                </SelectTrigger>
                <SelectContent>
                  {priceListSelectOptions.map((pl) => (
                    <SelectItem key={pl.id} value={pl.id}>
                      {pl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Commission Rate"
              htmlFor="fr-commission"
              hint="Referral commission paid to this franchise."
            >
              <div className="flex items-center gap-2">
                <Input
                  id="fr-commission"
                  type="number"
                  min={0}
                  max={100}
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(e.target.value)}
                />
                <span className="text-sm font-medium text-muted-foreground">%</span>
              </div>
            </Field>
          </section>

          <section className="flex flex-col gap-2">
            <Label>Service Areas</Label>
            <p className="text-xs text-muted-foreground">
              Orders placed for any of these areas show up in this franchise's orders list — in
              addition to city.
            </p>
            {assignedAreasQuery.isLoading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : (
              <AreaChecklist cityId={cityId} selectedIds={areaIds} onChange={setAreaIds} />
            )}
          </section>

          {franchiseType === "CO_LAB" && (
            <section className="flex flex-col gap-4 rounded-xl border border-dashed border-primary/40 bg-primary/[0.04] p-4">
              <p className="text-sm font-medium text-foreground">Co-Lab branding</p>
              <Field
                label="Lab Name"
                htmlFor="fr-lab-name"
                hint="Replaces Example Diagnostics Lab's name on this franchise's reports and invoices."
              >
                <Input
                  id="fr-lab-name"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="e.g. Jaipur Path Labs"
                />
              </Field>
              {!isEdit && (
                <p className="text-xs text-muted-foreground">
                  The lab logo can be uploaded from the franchise's detail panel once it is created.
                </p>
              )}
            </section>
          )}

          {!isEdit && (
            <section className="flex flex-col gap-4 rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-sm font-medium text-foreground">Portal login</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Username" htmlFor="fr-username">
                  <Input
                    id="fr-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. rdj_jaipur"
                    autoComplete="off"
                  />
                </Field>
                <Field
                  label="Password"
                  htmlFor="fr-password"
                  hint="8+ characters with upper, lower, number and symbol."
                >
                  <Input
                    id="fr-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </Field>
              </div>
            </section>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Create Franchise"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { OrganizationFormDialog };

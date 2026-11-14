import { useEffect, useRef, useState } from "react";
import { Building2, ImageUp, MapPin, Plus, Save } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useFranchiseProfile,
  useFranchiseServiceAreas,
  useOwnAreaRequests,
  useUpdateFranchiseProfile,
  useUploadFranchiseLogo,
} from "@/hooks/queries/useFranchise";
import { cn } from "@/utils/cn";

import { FranchiseAreaRequestDialog } from "./FranchiseAreaRequestDialog";

const AREA_REQUEST_STATUS_BADGE = {
  PENDING: { label: "Pending", variant: "warning" as const },
  APPROVED: { label: "Approved", variant: "success" as const },
  REJECTED: { label: "Rejected", variant: "destructive" as const },
};

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** A field the franchise cannot change — shown so the page is a complete
 *  picture of the account, with the reason it is locked. */
function ReadOnlyField({
  label,
  value,
  hint,
  mono,
}: {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input value={value} disabled className={cn(mono && "font-mono tracking-wider")} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FranchiseProfilePage() {
  const { data: profile, isLoading } = useFranchiseProfile();
  const serviceAreasQuery = useFranchiseServiceAreas();
  const areaRequestsQuery = useOwnAreaRequests();
  const updateMutation = useUpdateFranchiseProfile();
  const uploadMutation = useUploadFranchiseLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [areaRequestOpen, setAreaRequestOpen] = useState(false);

  const [ownerName, setOwnerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [labName, setLabName] = useState("");

  useEffect(() => {
    if (!profile) return;
    setOwnerName(profile.ownerName ?? "");
    setMobile(profile.mobile);
    setEmail(profile.email ?? "");
    setLabName(profile.labName ?? "");
  }, [profile]);

  const isCoLab = profile?.franchiseType === "CO_LAB";

  function handleSave() {
    if (!mobile.trim()) {
      toast.error("Mobile number is required.");
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error("Enter a valid email address.");
      return;
    }

    updateMutation.mutate(
      {
        ownerName: ownerName.trim() || null,
        mobile: mobile.trim(),
        email: email.trim() || null,
        // Only sent for a Co-Lab — the API rejects it otherwise, since a Single
        // Lab renders Example Diagnostics Lab's branding and has no lab name of its own.
        ...(isCoLab ? { labName: labName.trim() || null } : {}),
      },
      {
        onSuccess: () => toast.success("Profile updated."),
        onError: (error) => toast.error(errorMessage(error, "Failed to update profile")),
      },
    );
  }

  function handleLogoPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset immediately so re-picking the same file still fires a change event.
    event.target.value = "";
    if (!file) return;

    uploadMutation.mutate(file, {
      onSuccess: () => toast.success("Lab logo updated."),
      onError: (error) => toast.error(errorMessage(error, "Failed to upload logo")),
    });
  }

  if (isLoading || !profile) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Profile" description="Your franchise details." />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Profile" description="Your franchise details and branding." />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="size-7" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold text-foreground">{profile.name}</span>
            <span className="font-mono text-xs tracking-wider text-muted-foreground">
              {profile.code}
            </span>
          </div>
          <Badge variant={isCoLab ? "success" : "info"} className="ml-auto">
            {isCoLab ? "Co-Lab" : "Single Lab"}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-owner">Owner Name</Label>
            <Input
              id="pf-owner"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Owner / contact person"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-mobile">Mobile Number</Label>
            <Input
              id="pf-mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-email">Email</Label>
            <Input
              id="pf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
            />
          </div>
          <ReadOnlyField label="City" value={profile.cityName ?? "—"} />

          <div className="sm:col-span-2">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="size-4" />
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isCoLab && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Co-Lab branding</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-lab-name">Lab Name</Label>
              <Input
                id="pf-lab-name"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                placeholder="e.g. Jaipur Path Labs"
              />
              <p className="text-xs text-muted-foreground">
                Appears on your reports and invoices in place of Example Diagnostics Lab's name. Saved with the
                button above.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Lab Logo</Label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-20 w-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-secondary/40">
                  {profile.labLogoPath ? (
                    <img
                      src={profile.labLogoPath}
                      alt="Lab logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">No logo</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoPick}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                  >
                    <ImageUp className="size-4" />
                    {uploadMutation.isPending ? "Uploading…" : "Upload logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground">PNG, JPEG or SVG, up to 2 MB.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          <ReadOnlyField label="Username" value={profile.username ?? "—"} mono />
          <ReadOnlyField
            label="Price List"
            value={profile.priceListName ?? "Not assigned"}
            hint="Assigned by your lab administrator."
          />
          <ReadOnlyField
            label="Commission Rate"
            value={`${profile.commissionPct}%`}
            hint="Set by your lab administrator."
          />
          <ReadOnlyField
            label="Franchise Since"
            value={new Date(profile.createdAt).toLocaleDateString()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4 text-primary" />
            Service Areas
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAreaRequestOpen(true)}>
            <Plus className="size-3.5" />
            Request New Area
          </Button>
        </CardHeader>
        <CardContent>
          {serviceAreasQuery.isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : !serviceAreasQuery.data || serviceAreasQuery.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No areas assigned yet — orders route to you only if placed directly through your
              franchise. Contact your lab administrator, or request a new area below.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {serviceAreasQuery.data.map((area) => (
                  <Badge key={area.id} variant="outline" className="gap-1">
                    {area.name}
                    <span className="text-muted-foreground">· {area.cityName}</span>
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Bookings placed for any of these areas show up in your Orders — set by your lab
                administrator.
              </p>
            </>
          )}

          {areaRequestsQuery.data && areaRequestsQuery.data.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Your Area Requests
              </h4>
              {areaRequestsQuery.data.map((req) => {
                const badge = AREA_REQUEST_STATUS_BADGE[req.status];
                return (
                  <div
                    key={req.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{req.name}</span>
                      {req.status === "REJECTED" && req.rejectionReason && (
                        <span className="text-xs text-muted-foreground">{req.rejectionReason}</span>
                      )}
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <FranchiseAreaRequestDialog open={areaRequestOpen} onOpenChange={setAreaRequestOpen} />
    </div>
  );
}

export { FranchiseProfilePage };

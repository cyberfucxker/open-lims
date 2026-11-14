import { useState } from "react";
import { toast } from "sonner";
import { Banknote, Building2, KeyRound, MapPin, Phone, RotateCcw, Tag, User } from "lucide-react";

import { SidePanel } from "@/components/common/SidePanel";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useDisableOrganizationLogin,
  useEnableOrganizationLogin,
  useOrganization,
  useOrganizationServiceAreas,
  useUpdateOrganizationLogin,
} from "@/hooks/queries/useOrganizations";
import { formatCurrency } from "@/lib/format";
import {
  fetchFranchiseRoleId,
  type Organization,
  type OrganizationType,
} from "@/services/api/organizationApi";

const TYPE_BADGE: Record<
  OrganizationType,
  { label: string; variant: NonNullable<BadgeProps["variant"]> }
> = {
  GENERAL_CENTER: { label: "General Center", variant: "info" },
  COLLECTION_CENTER: { label: "Collection Center", variant: "success" },
};

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** Mirrors `PASSWORD_POLICY_REGEX` in `backend/src/utils/password.util.ts` —
 *  same "Admin@123"-style policy (8+ chars, upper, lower, digit, symbol) so a
 *  weak password is rejected here instead of round-tripping to the API first. */
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";

interface OrganizationDetailDrawerProps {
  organizationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function LoginSection({ organization }: { organization: Organization }) {
  const [settingUp, setSettingUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const enableMutation = useEnableOrganizationLogin();
  const updateMutation = useUpdateOrganizationLogin();
  const disableMutation = useDisableOrganizationLogin();

  const isBusy = enableMutation.isPending || updateMutation.isPending || disableMutation.isPending;

  async function handleToggle(checked: boolean) {
    if (!organization.login) {
      if (checked) setSettingUp(true);
      return;
    }
    updateMutation.mutate(
      { id: organization.id, input: { isActive: checked } },
      {
        onSuccess: () =>
          toast.success(
            `Portal login ${checked ? "enabled" : "disabled"} for ${organization.name}.`,
          ),
        onError: (error) => toast.error(errorMessage(error, "Failed to update login")),
      },
    );
  }

  async function handleSetupLogin() {
    if (!username.trim()) {
      toast.error("Enter a username.");
      return;
    }
    if (!PASSWORD_POLICY_REGEX.test(password)) {
      toast.error(PASSWORD_POLICY_MESSAGE);
      return;
    }
    const roleId = await fetchFranchiseRoleId();
    if (!roleId) {
      toast.error("FRANCHISE role not found — cannot create a portal login.");
      return;
    }
    enableMutation.mutate(
      {
        id: organization.id,
        input: {
          username: username.trim(),
          password,
          roleId,
          enabledModules: organization.enabledModules,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Portal login created for ${organization.name}.`);
          setSettingUp(false);
          setUsername("");
          setPassword("");
        },
        onError: (error) => toast.error(errorMessage(error, "Failed to create login")),
      },
    );
  }

  /** The original password can never be shown — it's stored as a one-way
   *  hash (`hashPassword` in `backend/src/utils/password.util.ts`), never in
   *  recoverable form. Setting a brand new one is the only way back in for an
   *  admin who doesn't already have it. */
  function handleResetPassword() {
    if (!PASSWORD_POLICY_REGEX.test(newPassword)) {
      toast.error(PASSWORD_POLICY_MESSAGE);
      return;
    }
    updateMutation.mutate(
      { id: organization.id, input: { password: newPassword } },
      {
        onSuccess: () => {
          toast.success(`Password reset for ${organization.name}.`);
          setResettingPassword(false);
          setNewPassword("");
        },
        onError: (error) => toast.error(errorMessage(error, "Failed to reset password")),
      },
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Portal Login
      </h3>
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            {organization.login ? organization.login.username : "No login set up"}
          </span>
          <span className="text-xs text-muted-foreground">
            {organization.login ? organization.login.roleName : "Enable to create portal access"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {organization.login && (
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => setResettingPassword((v) => !v)}
            >
              <RotateCcw className="size-3.5" /> Reset Password
            </Button>
          )}
          <Switch
            checked={organization.login?.isActive ?? false}
            disabled={isBusy}
            onCheckedChange={handleToggle}
          />
        </div>
      </div>

      {resettingPassword && organization.login && (
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reset-password">New password for {organization.login.username}</Label>
            <Input
              id="reset-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters, mixed case, number, symbol"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setResettingPassword(false);
                setNewPassword("");
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleResetPassword} disabled={updateMutation.isPending}>
              <KeyRound className="size-4" /> Set New Password
            </Button>
          </div>
        </div>
      )}

      {settingUp && (
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-username">Username</Label>
            <Input
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSettingUp(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSetupLogin} disabled={enableMutation.isPending}>
              <KeyRound className="size-4" /> Create Login
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Read-only — which Area(s) this franchise is assigned to cover. Editing
 *  lives in `OrganizationFormDialog`'s Edit mode now, alongside city, so a
 *  franchise's whole geography (city + areas) is assigned in one place. */
function ServiceAreasSummary({ organizationId }: { organizationId: string }) {
  const { data: areas, isLoading } = useOrganizationServiceAreas(organizationId);

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Service Areas
      </h3>
      {isLoading ? (
        <Skeleton className="h-8 w-full rounded-lg" />
      ) : !areas || areas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No areas assigned — use Edit to assign a city and its areas.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => (
            <Badge key={area.id} variant="outline" className="gap-1">
              {area.name}
              <span className="text-muted-foreground">· {area.cityName}</span>
            </Badge>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Orders placed for any of these areas show up in this franchise's orders list.
      </p>
    </section>
  );
}

function OrganizationDetailDrawer({
  organizationId,
  open,
  onOpenChange,
}: OrganizationDetailDrawerProps) {
  const { data: organization, isLoading } = useOrganization(organizationId ?? undefined);

  if (!organizationId) return null;

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title={organization?.name ?? "Organization"}
      description={organizationId ? `Organization ID: ${organizationId}` : undefined}
    >
      {isLoading || !organization ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{organization.name}</p>
                <Badge variant={TYPE_BADGE[organization.type].variant} className="mt-1">
                  {TYPE_BADGE[organization.type].label}
                </Badge>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border/70 pt-4 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="text-foreground">
                  {organization.cityName ?? organization.city ?? "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="text-foreground">{organization.contactPerson ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="tabular-nums text-foreground">{organization.mobile}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Banknote className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="tabular-nums text-foreground">
                  {organization.orderCount} orders
                </span>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Price List
            </h3>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <Tag className="size-4 shrink-0 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {organization.priceListName ?? "Not assigned"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Use Edit to change the assigned price list.
            </p>
          </section>

          <ServiceAreasSummary organizationId={organization.id} />

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Settlement &amp; Commission
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-xs text-muted-foreground">Commission Rate</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                  {organization.commissionPct}%
                </p>
              </div>
              <div
                className={
                  organization.settlementDue > 0
                    ? "rounded-2xl border border-warning/30 bg-warning/[0.06] p-4 shadow-sm"
                    : "rounded-2xl border border-border bg-card p-4 shadow-sm"
                }
              >
                <p className="text-xs text-muted-foreground">Settlement Due</p>
                <p
                  className={
                    organization.settlementDue > 0
                      ? "mt-1 text-xl font-bold tabular-nums text-warning"
                      : "mt-1 text-xl font-bold tabular-nums text-foreground"
                  }
                >
                  {formatCurrency(organization.settlementDue)}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Live outstanding balance across this organization's patient bills — settle individual
              bills from the LIMS billing screen. Use Edit to change the commission rate.
            </p>
          </section>

          <LoginSection organization={organization} />
        </div>
      )}
    </SidePanel>
  );
}

export { OrganizationDetailDrawer };

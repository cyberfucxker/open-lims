import { Building2, CreditCard, KeyRound, Mail, MapPin, Phone } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useOrganizationAuditLogs } from "@/hooks/queries/useOrganizations";
import type { Organization } from "@/types/organization";

const TYPE_LABEL: Record<Organization["type"], string> = {
  GENERAL_CENTER: "General Center",
  COLLECTION_CENTER: "Collection Center",
};

const MODULE_LABEL: Record<string, string> = {
  patients: "Patient Registration",
  samples: "Sample Collection",
  reports: "Report Download",
  invoices: "Invoice Access",
};

interface OrganizationDetailSheetProps {
  organization: Organization | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function OrganizationDetailSheet({
  organization,
  open,
  onOpenChange,
}: OrganizationDetailSheetProps) {
  const { data: auditLogs } = useOrganizationAuditLogs(open ? organization?.id : undefined);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-lg">
        {organization && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <SheetTitle>{organization.name}</SheetTitle>
                  <p className="text-xs text-muted-foreground">
                    {organization.code} · {TYPE_LABEL[organization.type]}
                  </p>
                </div>
                <StatusBadge
                  status={
                    organization.deletedAt ? "Deleted" : organization.active ? "Active" : "Inactive"
                  }
                  className="ml-auto"
                />
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4" /> {organization.mobile}
                </div>
                {organization.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-4" /> {organization.email}
                  </div>
                )}
                {(organization.address || organization.city) && (
                  <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                    <MapPin className="size-4" />
                    {[
                      organization.address,
                      organization.city,
                      organization.state,
                      organization.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
              </div>

              {organization.contactPerson && (
                <div>
                  <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Contact Person
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {organization.contactPerson}
                  </p>
                </div>
              )}

              {organization.description && (
                <div>
                  <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Description
                  </p>
                  <p className="text-sm text-muted-foreground">{organization.description}</p>
                </div>
              )}

              <Separator />

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <CreditCard className="size-3.5" /> Financial & Billing
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Price List</p>
                    <p className="font-medium text-foreground">
                      {organization.priceListName ?? "Standard catalogue"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Type</p>
                    <p className="font-medium text-foreground">
                      {organization.paymentType === "PREPAID" ? "Prepaid" : "Postpaid / Credit"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Credit Limit</p>
                    <p className="font-medium text-foreground">
                      ₹{organization.creditLimit.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Advance Amount</p>
                    <p className="font-medium text-foreground">
                      ₹{organization.advanceAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Days</p>
                    <p className="font-medium text-foreground">{organization.dueDays}</p>
                  </div>
                  {organization.source && (
                    <div>
                      <p className="text-muted-foreground">Source</p>
                      <p className="font-medium text-foreground">{organization.source}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <KeyRound className="size-3.5" /> Access & Permissions
                </p>
                {organization.login ? (
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Username</span>
                      <span className="font-medium text-foreground">
                        {organization.login.username}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Role</span>
                      <span className="font-medium text-foreground">
                        {organization.login.roleName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Login Status</span>
                      <StatusBadge status={organization.login.isActive ? "Active" : "Inactive"} />
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {organization.enabledModules.length === 0 && (
                        <span className="text-xs text-muted-foreground">No modules enabled</span>
                      )}
                      {organization.enabledModules.map((module) => (
                        <Badge key={module} variant="secondary">
                          {MODULE_LABEL[module] ?? module}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Portal login is not enabled for this organization.
                  </p>
                )}
              </div>

              {auditLogs && auditLogs.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Recent Activity
                    </p>
                    <div className="flex flex-col gap-2">
                      {auditLogs.slice(0, 10).map((log) => (
                        <div key={log.id} className="flex items-center justify-between text-xs">
                          <span className="text-foreground">{log.action.replace(/_/g, " ")}</span>
                          <span className="text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export { OrganizationDetailSheet };

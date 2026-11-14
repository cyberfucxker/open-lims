import { FileText, Receipt, TestTube, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMyOrganization } from "@/hooks/queries/useMyOrganization";
import type { OrganizationModule } from "@/types/organization";

const MODULE_CARDS: Record<
  OrganizationModule,
  { label: string; description: string; icon: typeof Users; path: string }
> = {
  patients: {
    label: "Patient Registration",
    description: "Register new patients for this center",
    icon: Users,
    path: "/portal/patients/register",
  },
  samples: {
    label: "Sample Collection",
    description: "Collect samples and print barcode labels",
    icon: TestTube,
    path: "/portal/samples",
  },
  reports: {
    label: "Reports",
    description: "View and download patient reports",
    icon: FileText,
    path: "/portal/reports",
  },
  invoices: {
    label: "Invoices",
    description: "View and download invoices",
    icon: Receipt,
    path: "/portal/invoices",
  },
};

function PortalDashboardPage() {
  const { user } = useAuth();
  const { data: organization } = useMyOrganization();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome, ${organization?.name ?? user?.fullName ?? user?.username}`}
        description="Collection Center Portal — quick access to your enabled features."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(organization?.enabledModules ?? []).map((module) => {
          const card = MODULE_CARDS[module];
          if (!card) return null;
          const Icon = card.icon;
          return (
            <Link key={module} to={card.path}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-3 pt-6">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{card.label}</p>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {organization && organization.enabledModules.length === 0 && (
          <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-4">
            No modules are enabled for this organization yet. Contact your lab administrator.
          </p>
        )}
      </div>
    </div>
  );
}

export { PortalDashboardPage };

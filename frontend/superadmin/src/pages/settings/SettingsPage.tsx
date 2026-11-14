import { useState } from "react";
import {
  CreditCard,
  Percent,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { formatDate } from "@/lib/format";
import { cn } from "@/utils/cn";

import { AppVersionSection } from "./AppVersionSection";
import { GeneralSection } from "./GeneralSection";
import { PaymentGatewaySection } from "./PaymentGatewaySection";
import { RolesPermissionsSection } from "./RolesPermissionsSection";
import { TaxSection } from "./TaxSection";
import { WalletSettingsSection } from "./WalletSettingsSection";
import { useStaffUsers } from "@/hooks/queries/useStaffUsers";

type SectionKey = "general" | "payment" | "wallet" | "roles" | "tax" | "version";

interface SectionDef {
  key: SectionKey;
  label: string;
  description: string;
  icon: LucideIcon;
}

const SECTIONS: SectionDef[] = [
  { key: "general", label: "General", description: "App identity & contact", icon: SettingsIcon },
  {
    key: "payment",
    label: "Payment Gateway",
    description: "Razorpay & webhooks",
    icon: CreditCard,
  },
  { key: "wallet", label: "Wallet Settings", description: "Recharge & cashback", icon: Wallet },
  {
    key: "roles",
    label: "Team & Access",
    description: "Manager logins",
    icon: ShieldCheck,
  },
  { key: "tax", label: "Tax / GST", description: "Invoice & tax rules", icon: Percent },
  { key: "version", label: "App Version", description: "Force update config", icon: Smartphone },
];

const LAST_UPDATED = new Date().toISOString();

function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("general");
  const { data: staffUsers } = useStaffUsers();
  const activeManagers = (staffUsers ?? []).filter(
    (u) => u.role === "MANAGER" && u.isActive,
  ).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Settings"
        description="Configure app-wide defaults, payments, access and rollout controls."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Environment"
          value="Production"
          icon={ShieldCheck}
          gradient="bg-primary"
          index={0}
        />
        <StatCard
          title="Last Updated"
          value={formatDate(LAST_UPDATED)}
          icon={SettingsIcon}
          gradient="bg-sky-500"
          index={1}
        />
        <StatCard
          title="Active Managers"
          value={String(activeManagers)}
          icon={Wallet}
          gradient="bg-emerald-500"
          index={2}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
        <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-sm lg:flex-col lg:overflow-visible">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const active = section.key === activeSection;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={cn(
                  "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors lg:shrink",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="hidden flex-col lg:flex">
                  <span className={cn("font-medium", active ? "text-primary" : "text-foreground")}>
                    {section.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{section.description}</span>
                </span>
                <span className="font-medium lg:hidden">{section.label}</span>
              </button>
            );
          })}
        </nav>

        <div>
          {activeSection === "general" && <GeneralSection />}
          {activeSection === "payment" && <PaymentGatewaySection />}
          {activeSection === "wallet" && <WalletSettingsSection />}
          {activeSection === "roles" && <RolesPermissionsSection />}
          {activeSection === "tax" && <TaxSection />}
          {activeSection === "version" && <AppVersionSection />}
        </div>
      </div>
    </div>
  );
}

export { SettingsPage };

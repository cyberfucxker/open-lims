import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  BadgeCheck,
  ChevronRight,
  ClipboardList,
  FileText,
  LogOut,
  MapPin,
  Trash2,
  Upload,
  Users,
  Wallet as WalletIcon,
  type LucideIcon,
} from "lucide-react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHero, PageHeroChip } from "@/components/common/PageHero";
import { Button } from "@/components/ui/button";
import { AccountLinkTile } from "@/components/profile/AccountLinkTile";
import { EditProfileSheet } from "@/components/profile/EditProfileSheet";
import { ProfileIdentityCard } from "@/components/profile/ProfileIdentityCard";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/queries/useProfile";
import { cn } from "@/utils/cn";

/** Family and Address used to render inline here (a full grid of cards each)
 *  — now just two nav tiles into their own pages, so Profile stays a short
 *  overview instead of growing with however many of each the patient has. */
const FAMILY_ADDRESS_LINKS: {
  to: string;
  label: string;
  caption: string;
  icon: LucideIcon;
  iconClass: string;
}[] = [
  {
    to: "/family-members",
    label: "Family Members",
    caption: "Who you book tests for",
    icon: Users,
    iconClass: "bg-brand-violet/10 text-brand-violet",
  },
  {
    to: "/addresses",
    label: "Addresses",
    caption: "Where we collect your samples",
    icon: MapPin,
    iconClass: "bg-primary/10 text-primary",
  },
];

const QUICK_LINKS: {
  to: string;
  label: string;
  caption: string;
  icon: LucideIcon;
  iconClass: string;
}[] = [
  {
    to: "/orders",
    label: "My Bookings",
    caption: "Track tests and collections",
    icon: ClipboardList,
    iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    to: "/wallet",
    label: "Wallet",
    caption: "Balance, top-ups and refunds",
    icon: WalletIcon,
    iconClass: "bg-brand-teal/10 text-brand-teal",
  },
  {
    to: "/reports",
    label: "Reports",
    caption: "Download your lab reports",
    icon: FileText,
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    to: "/prescriptions",
    label: "Prescriptions",
    caption: "Upload a doctor's prescription",
    icon: Upload,
    iconClass: "bg-brand-violet/10 text-brand-violet",
  },
];

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  description,
  onClick,
  destructive = false,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3.5 rounded-2xl border bg-card p-4 text-left shadow-sm outline-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.06] focus-visible:ring-4 focus-visible:ring-ring",
        destructive
          ? "border-destructive/20 hover:border-destructive/35"
          : "border-border hover:border-primary/25",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-current/15 transition-transform duration-300 group-hover:scale-105",
          destructive ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm font-semibold", destructive && "text-destructive")}>
          {label}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{description}</span>
      </span>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-200",
          destructive
            ? "group-hover:bg-destructive/10 group-hover:text-destructive"
            : "group-hover:bg-primary/10 group-hover:text-primary",
        )}
      >
        <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Logged out");
  };

  // Phase 2 blocker: no backend endpoint yet — see build plan gap list. UI-only for now.
  const handleDeleteAccount = () => {
    logout();
    navigate("/");
    toast.success("Account deleted");
  };

  return (
    <div className="pb-10">
      <PageHero
        eyebrow={
          <PageHeroChip icon={<BadgeCheck className="size-3.5" />}>
            {profile?.is_profile_complete
              ? "Verified patient account"
              : "Finish setting up your account"}
          </PageHeroChip>
        }
        title="My Account"
        description="Your identity, the family you book for, and everything attached to your bookings."
      >
        <ProfileIdentityCard
          profile={profile}
          isLoading={profileLoading}
          onEdit={() => setEditOpen(true)}
        />
      </PageHero>

      <div className="mx-auto max-w-5xl space-y-7 px-4 pt-6">
        <section className="space-y-3">
          <SectionHeading
            title="Family & Address"
            description="Who you book for, and where we collect"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {FAMILY_ADDRESS_LINKS.map((link, i) => (
              <AccountLinkTile key={link.to} {...link} index={i} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeading
            title="Quick access"
            description="Jump straight to the things you use most"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((link, i) => (
              <AccountLinkTile key={link.to} {...link} index={i} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeading title="Account" description="Sign out or close your account" />
          <SettingsRow
            icon={Trash2}
            label="Delete Account"
            description="Permanently remove your account and data"
            destructive
            onClick={() => setDeleteAccountOpen(true)}
          />

          <Button variant="outline" className="w-full sm:w-auto" onClick={handleLogout}>
            <LogOut className="size-4" />
            Logout
          </Button>
        </section>
      </div>

      <EditProfileSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        defaultName={profile?.name ?? ""}
        defaultEmail={profile?.email ?? ""}
      />
      <ConfirmDialog
        open={deleteAccountOpen}
        onOpenChange={setDeleteAccountOpen}
        title="Delete your account?"
        description="This will permanently delete your account and all associated data. This action cannot be undone."
        confirmLabel="Delete Account"
        destructive
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}

export { ProfilePage };

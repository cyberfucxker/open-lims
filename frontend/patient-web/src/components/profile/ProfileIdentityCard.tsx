import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Mail, Pencil, Phone } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { GenderAvatarIcon } from "@/components/profile/GenderAvatarIcon";
import { EASE_OUT_EXPO } from "@/utils/motion";
import type { ProfileResult } from "@/types";

function InfoChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function IdentitySkeleton() {
  return (
    <div
      className="rounded-[1.5rem] border border-border/70 bg-card/80 p-4 shadow-sm sm:p-5"
      aria-hidden
    >
      <div className="flex items-start gap-4">
        <Skeleton className="size-16 shrink-0 rounded-full sm:size-20" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProfileIdentityCardProps {
  profile: ProfileResult | undefined;
  isLoading?: boolean;
  onEdit: () => void;
}

function ProfileIdentityCard({ profile, isLoading = false, onEdit }: ProfileIdentityCardProps) {
  if (isLoading) return <IdentitySkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05, ease: EASE_OUT_EXPO }}
      className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:p-5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-gradient-to-br from-primary/10 to-brand-teal/10 blur-3xl"
      />

      <div className="relative flex items-start gap-4">
        <div className="relative shrink-0">
          <Avatar className="relative size-16 ring-2 ring-card sm:size-20">
            {profile?.profile_pic && (
              <AvatarImage src={profile.profile_pic} alt={profile.name ?? "Profile photo"} />
            )}
            {/* No padding and no `bg-card`: the illustrated avatars carry
                their own circular field, so anything behind them would only
                show as a rim. The neutral silhouette insets itself. */}
            <AvatarFallback className="bg-card text-primary">
              <GenderAvatarIcon gender={profile?.sex} />
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit profile"
            className="absolute -right-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-card transition-transform active:scale-90"
          >
            <Pencil className="size-3.5" />
          </button>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="truncate text-lg font-bold tracking-tight">
            {profile?.name ?? "Add your name"}
          </h2>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="size-3.5 shrink-0" />
            <span className="truncate tabular-nums">{profile?.mobile}</span>
            <BadgeCheck
              className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-label="Mobile verified"
            />
          </p>

          {profile?.email && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-3.5 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1">
            {profile?.age && <InfoChip>{profile.age} yrs</InfoChip>}
            {profile?.sex && <InfoChip>{profile.sex}</InfoChip>}
            {profile?.is_profile_complete && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                <BadgeCheck className="size-3" />
                Registered
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { ProfileIdentityCard };

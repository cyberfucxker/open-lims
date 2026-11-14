import { motion } from "framer-motion";
import { Phone, Trash2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GenderAvatarIcon } from "@/components/profile/GenderAvatarIcon";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";
import { EASE_OUT_EXPO } from "@/utils/motion";
import type { FamilyMemberRelation, FamilyMemberResult } from "@/types";

/** A stable tint per relation makes a family grid scannable at a glance without needing
 *  to read every label. */
const RELATION_TINT: Record<FamilyMemberRelation, string> = {
  Self: "bg-primary/10 text-primary ring-primary/20",
  Father: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
  Mother: "bg-brand-violet/10 text-brand-violet ring-brand-violet/20",
  Spouse: "bg-brand-teal/10 text-brand-teal ring-brand-teal/20",
  Son: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  Daughter: "bg-pink-500/10 text-pink-600 ring-pink-500/20 dark:text-pink-400",
  Brother: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
  Sister: "bg-brand-violet/10 text-brand-violet ring-brand-violet/20",
  Other: "bg-muted text-muted-foreground ring-border",
};

interface FamilyMemberCardProps {
  member: FamilyMemberResult;
  index?: number;
  onRemove: (memberId: string) => void;
}

function FamilyMemberCard({ member, index = 0, onRemove }: FamilyMemberCardProps) {
  const reduceMotion = usePrefersReducedMotion();
  const isSelf = member.relation === "Self";
  const tint = RELATION_TINT[member.relation] ?? RELATION_TINT.Other;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index, 6) * 0.05, ease: EASE_OUT_EXPO }}
      className="h-full"
    >
      <div className="flex h-full items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-black/[0.05]">
        {/* The relation tint now lives in the ring rather than behind the
            avatar: an illustrated avatar covers the fill entirely, so a
            background colour there would be invisible, while the ring keeps
            the family grid scannable by relation at a glance. */}
        <span
          aria-hidden
          className={cn(
            "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1",
            tint,
          )}
        >
          <GenderAvatarIcon gender={member.gender} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{member.name}</p>
            {isSelf && (
              <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-primary">
                YOU
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {member.relation} · {member.age}y · {member.gender}
          </p>
          {member.mobile_no && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Phone className="size-3 shrink-0" />
              <span className="truncate tabular-nums">{member.mobile_no}</span>
            </p>
          )}
        </div>

        {!isSelf && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(member.id)}
            aria-label={`Remove ${member.name}`}
            className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function AddFamilyMemberTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full min-h-[104px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border p-4 text-muted-foreground outline-none transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:ring-4 focus-visible:ring-ring"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-muted">
        <UserPlus className="size-4" />
      </span>
      <span className="text-xs font-semibold">Add family member</span>
      <span className="text-[11px]">Book tests on their behalf</span>
    </button>
  );
}

export { FamilyMemberCard, AddFamilyMemberTile };

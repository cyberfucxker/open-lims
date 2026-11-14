import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus, Users } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { AddFamilyMemberSheet } from "@/components/family/AddFamilyMemberSheet";
import { useFamilyMembers } from "@/hooks/queries/useProfile";
import { cn } from "@/utils/cn";
import type { FamilyMemberResult } from "@/types";

interface FamilyMemberSectionProps {
  selectedId: string | null;
  onSelect: (member: FamilyMemberResult) => void;
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** "Book this for..." picker shown alongside address selection — lets the
 *  patient pick which family member the whole cart is for, or add a new
 *  one. Defaults to the "Self" member (or the first member) once the list
 *  loads if nothing is selected yet. */
function FamilyMemberSection({ selectedId, onSelect }: FamilyMemberSectionProps) {
  const { data, isLoading } = useFamilyMembers();
  const [addOpen, setAddOpen] = useState(false);
  const members = data?.family_members ?? [];

  useEffect(() => {
    if (selectedId || members.length === 0) return;
    const self = members.find((m) => m.relation === "Self");
    onSelect(self ?? members[0]);
    // Only react to the list becoming available — re-running on every
    // onSelect/selectedId change would fight the user's own picks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members]);

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] text-white shadow-sm">
          <Users className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-foreground">Book this for</h2>
          <p className="text-xs text-muted-foreground">
            Reports will be issued in this person&apos;s name
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
              <Skeleton className="size-5 shrink-0 rounded-full" />
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {members.map((member, i) => {
            const selected = selectedId === member.id;
            return (
              <motion.button
                key={member.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: Math.min(i, 6) * 0.04, ease: "easeOut" }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                aria-pressed={selected}
                onClick={() => onSelect(member)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-all",
                  selected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border/60 hover:border-primary/40 hover:shadow-sm",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    selected ? "border-primary bg-primary" : "border-input",
                  )}
                >
                  {selected && (
                    <motion.span
                      initial={{ scale: 0.4 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 14, stiffness: 420 }}
                    >
                      <Check className="size-3 text-white" strokeWidth={3} />
                    </motion.span>
                  )}
                </span>

                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    selected
                      ? "bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {initialsOf(member.name) || <Users className="size-4" />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {member.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {member.relation} · {member.age}y · {member.gender}
                  </span>
                </span>
              </motion.button>
            );
          })}

          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-input p-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/40 hover:text-foreground"
          >
            <Plus className="size-4" />
            Add family member
          </button>
        </div>
      )}

      <AddFamilyMemberSheet open={addOpen} onOpenChange={setAddOpen} onAdded={onSelect} />
    </section>
  );
}

export { FamilyMemberSection };

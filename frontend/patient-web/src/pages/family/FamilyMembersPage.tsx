import { useState } from "react";
import { Plus, Users } from "lucide-react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddFamilyMemberSheet } from "@/components/family/AddFamilyMemberSheet";
import { AddFamilyMemberTile, FamilyMemberCard } from "@/components/profile/FamilyMemberCard";
import { useFamilyMembers, useRemoveFamilyMember } from "@/hooks/queries/useProfile";

/** Own page for the family list, out of Profile's own scroll — Profile links
 *  here instead of rendering the grid inline (see `ProfilePage`'s "Family &
 *  Address" section). Mirrors `AddressListPage`'s manage-mode layout. */
function FamilyMembersPage() {
  const { data: familyData, isLoading } = useFamilyMembers();
  const removeMemberMutation = useRemoveFamilyMember();

  const [addOpen, setAddOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const familyMembers = familyData?.family_members ?? [];
  const isEmpty = !isLoading && familyMembers.length === 0;

  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        title="Family Members"
        right={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Add family member"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="size-5" />
          </Button>
        }
      />

      <div className="mx-auto max-w-5xl px-4 py-4">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2" aria-hidden>
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <Skeleton className="size-11 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={Users}
            title="No family members yet"
            description="Add family members to book tests for them under your account."
            actionLabel="Add family member"
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {familyMembers.map((member, i) => (
              <FamilyMemberCard
                key={member.id}
                member={member}
                index={i}
                onRemove={setPendingRemoveId}
              />
            ))}
            <AddFamilyMemberTile onClick={() => setAddOpen(true)} />
          </div>
        )}
      </div>

      <AddFamilyMemberSheet open={addOpen} onOpenChange={setAddOpen} />

      <ConfirmDialog
        open={!!pendingRemoveId}
        onOpenChange={(open) => !open && setPendingRemoveId(null)}
        title="Remove this family member?"
        description="This cannot be undone."
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (pendingRemoveId) removeMemberMutation.mutate(pendingRemoveId);
          setPendingRemoveId(null);
        }}
      />
    </div>
  );
}

export { FamilyMembersPage };

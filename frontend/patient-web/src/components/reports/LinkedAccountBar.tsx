import { useState } from "react";
import { BadgeCheck, Unlink } from "lucide-react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useThirdPartyLabStore } from "@/store/thirdPartyLabStore";

/** Shows which mobile number the partner-lab account is linked to, with a way out.
 *
 *  `thirdPartyLabStore.clear()` existed but had no caller, so a patient who linked the
 *  wrong number was stuck with it permanently — the link card is only reachable while
 *  `userFID` is null. Unlinking just drops the persisted local state; re-linking is the
 *  same OTP flow, and no server state is touched. */
function LinkedAccountBar() {
  const mobile = useThirdPartyLabStore((s) => s.mobile);
  const clear = useThirdPartyLabStore((s) => s.clear);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-2.5">
        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <BadgeCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          Linked to
          <span className="font-semibold text-foreground tabular-nums">
            {mobile ? `+91 ${mobile}` : "your partner lab account"}
          </span>
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Unlink className="size-3.5" />
          Change number
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Unlink this lab account?"
        description="You'll need to verify a mobile number again to view reports. Nothing is deleted at the lab."
        confirmLabel="Unlink"
        cancelLabel="Keep linked"
        onConfirm={() => {
          clear();
          setConfirmOpen(false);
        }}
      />
    </>
  );
}

export { LinkedAccountBar };

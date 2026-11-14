import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { RippleButton } from "@/components/common/RippleButton";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBulkAssignReferralDoctors } from "@/hooks/queries/useReferralDoctors";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { MarketingStaff } from "@/types/marketingStaff";

/**
 * Temporary local fetch for the active marketing staff picker.
 * `useMarketingStaff.ts` (built by a parallel agent) does not yet expose a
 * dedicated "active staff" hook, so this queries the endpoint directly.
 * Safe to replace with a shared hook from useMarketingStaff.ts once available.
 */
function useActiveMarketingStaffOptions() {
  return useQuery({
    queryKey: ["marketingStaff", "active"],
    queryFn: async () => {
      const response =
        await httpClient.get<ApiResponseBody<MarketingStaff[]>>("/marketing-staff/active");
      return (response.data.data as MarketingStaff[]) ?? [];
    },
    staleTime: 60_000,
  });
}

interface AssignDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorIds: string[];
  onAssigned?: () => void;
}

function AssignDoctorDialog({
  open,
  onOpenChange,
  doctorIds,
  onAssigned,
}: AssignDoctorDialogProps) {
  const [marketingStaffId, setMarketingStaffId] = useState("");
  const { data: staffList } = useActiveMarketingStaffOptions();
  const bulkAssign = useBulkAssignReferralDoctors();

  const staffOptions = (staffList ?? []).map((staff) => ({
    value: staff.id,
    label: staff.name,
    description: staff.employeeCode,
  }));

  const count = doctorIds.length;

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setMarketingStaffId("");
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    if (!marketingStaffId || count === 0) return;
    try {
      await bulkAssign.mutateAsync({ doctorIds, marketingStaffId });
      toast.success(`${count} doctor${count === 1 ? "" : "s"} assigned successfully`);
      setMarketingStaffId("");
      onAssigned?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to assign doctors");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Referral Doctors</DialogTitle>
          <DialogDescription>
            Choose a marketing staff member to own the selected referral doctors.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Marketing Staff</label>
          <SearchableSelect
            options={staffOptions}
            value={marketingStaffId}
            onChange={setMarketingStaffId}
            placeholder="Select marketing staff…"
            searchPlaceholder="Search staff…"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <RippleButton
            type="button"
            disabled={!marketingStaffId || count === 0 || bulkAssign.isPending}
            onClick={handleSubmit}
          >
            {bulkAssign.isPending
              ? "Assigning…"
              : `Assign ${count} doctor${count === 1 ? "" : "s"}`}
          </RippleButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { AssignDoctorDialog };

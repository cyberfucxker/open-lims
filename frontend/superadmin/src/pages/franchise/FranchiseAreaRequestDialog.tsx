import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidePanel } from "@/components/common/SidePanel";
import { useCreateAreaRequest, useFranchiseProfile } from "@/hooks/queries/useFranchise";

interface FranchiseAreaRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Lets a franchise propose a new Area in its own city — nothing changes
 *  until an admin approves it from Superadmin's "Area Approval" tab (Cities
 *  & Areas); this just submits the request. */
function FranchiseAreaRequestDialog({ open, onOpenChange }: FranchiseAreaRequestDialogProps) {
  const [name, setName] = useState("");
  const [pincodesInput, setPincodesInput] = useState("");
  const { data: profile } = useFranchiseProfile();
  const createRequest = useCreateAreaRequest();

  useEffect(() => {
    if (!open) return;
    setName("");
    setPincodesInput("");
  }, [open]);

  function handleSubmit() {
    if (name.trim().length < 2) return toast.error("Enter the area name");

    const pincodes = pincodesInput
      .split(/[\s,]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const invalid = pincodes.find((p) => !/^[0-9]{6}$/.test(p));
    if (invalid) return toast.error(`"${invalid}" is not a valid 6-digit pincode`);

    createRequest.mutate(
      { name: name.trim(), pincodes },
      {
        onSuccess: () => {
          toast.success("Request submitted — an admin will review it.");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to submit request");
        },
      },
    );
  }

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title="Request New Area"
      description={
        profile?.cityName
          ? `Within ${profile.cityName} — pending an admin's approval before it's added.`
          : "Pending an admin's approval before it's added."
      }
      widthClassName="sm:max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createRequest.isPending}>
            {createRequest.isPending ? "Submitting…" : "Submit Request"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Area Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vaishali Nagar"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Pincodes (optional)</Label>
          <Input
            value={pincodesInput}
            onChange={(e) => setPincodesInput(e.target.value)}
            placeholder="e.g. 302021, 302034"
          />
          <p className="text-xs text-muted-foreground">
            Separate multiple pincodes with a comma or space — helps match patient addresses to this
            area once it's approved.
          </p>
        </div>
      </div>
    </SidePanel>
  );
}

export { FranchiseAreaRequestDialog };

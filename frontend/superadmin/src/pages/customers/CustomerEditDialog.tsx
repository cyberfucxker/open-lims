import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCities } from "@/hooks/queries/useCitySlotConfig";
import { useUpdateAppUser } from "@/hooks/queries/useAppUsers";
import type { AppUserFormValues, AppUserProfile } from "@/services/api/appUserApi";

interface CustomerEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: AppUserProfile;
}

interface FormState {
  name: string;
  email: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "";
  dob: string;
  cityId: string;
}

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function CustomerEditDialog({ open, onOpenChange, profile }: CustomerEditDialogProps) {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    gender: "",
    dob: "",
    cityId: "",
  });

  const citiesQuery = useCities();
  const cities = citiesQuery.data ?? [];

  const updateAppUser = useUpdateAppUser();

  useEffect(() => {
    if (!open) return;
    setForm({
      name: profile.name ?? "",
      email: profile.email ?? "",
      gender: (profile.gender as FormState["gender"]) ?? "",
      dob: toDateInputValue(profile.dob),
      cityId: profile.city?.id ?? "",
    });
  }, [open, profile]);

  function handleSubmit() {
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error("Enter a valid email address.");
      return;
    }

    const values: AppUserFormValues = {
      name: form.name.trim() || null,
      email: form.email.trim() || null,
      gender: form.gender || null,
      dob: form.dob ? new Date(form.dob).toISOString() : null,
      cityId: form.cityId || null,
    };

    updateAppUser.mutate(
      { id: profile.id, values },
      {
        onSuccess: () => {
          toast.success("Customer details updated.");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Something went wrong.");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Update this customer's profile details. Mobile number is the login ID and can't be
            changed here.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-mobile">Mobile Number</Label>
            <Input id="customer-mobile" value={profile.mobile} disabled />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-name">Name</Label>
            <Input
              id="customer-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Priya Sharma"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-email">Email</Label>
            <Input
              id="customer-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="priya@example.com"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Gender</Label>
              <Select
                value={form.gender || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, gender: v as FormState["gender"] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customer-dob">Date of Birth</Label>
              <Input
                id="customer-dob"
                type="date"
                value={form.dob}
                onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>City</Label>
            <Select
              value={form.cityId || undefined}
              onValueChange={(v) => setForm((f) => ({ ...f, cityId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateAppUser.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateAppUser.isPending}>
            {updateAppUser.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { CustomerEditDialog };

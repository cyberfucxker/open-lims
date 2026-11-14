import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { RippleButton } from "@/components/common/RippleButton";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateReferralDoctor,
  useUpdateReferralDoctor,
} from "@/hooks/queries/useReferralDoctors";
import {
  referralDoctorFormSchema,
  type ReferralDoctorFormSchemaType,
} from "@/schemas/referralDoctorSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { MarketingStaff } from "@/types/marketingStaff";
import type { ReferralDoctor } from "@/types/referralDoctor";

const DEFAULT_VALUES: ReferralDoctorFormSchemaType = {
  doctorName: "",
  hospitalName: "",
  speciality: "",
  mobile: "",
  email: "",
  city: "",
  address: "",
  remarks: "",
  marketingStaffId: "",
  status: true,
};

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

interface ReferralDoctorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralDoctor?: ReferralDoctor | null;
}

function ReferralDoctorFormDialog({
  open,
  onOpenChange,
  referralDoctor,
}: ReferralDoctorFormDialogProps) {
  const isEdit = !!referralDoctor;
  const createReferralDoctor = useCreateReferralDoctor();
  const updateReferralDoctor = useUpdateReferralDoctor();
  const isPending = createReferralDoctor.isPending || updateReferralDoctor.isPending;
  const { data: staffList } = useActiveMarketingStaffOptions();

  const staffOptions = [
    { value: "", label: "Unassigned" },
    ...(staffList ?? []).map((staff) => ({
      value: staff.id,
      label: staff.name,
      description: staff.employeeCode,
    })),
  ];

  const form = useForm<ReferralDoctorFormSchemaType>({
    resolver: zodResolver(referralDoctorFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        referralDoctor
          ? {
              doctorName: referralDoctor.doctorName,
              hospitalName: referralDoctor.hospitalName ?? "",
              speciality: referralDoctor.speciality ?? "",
              mobile: referralDoctor.mobile ?? "",
              email: referralDoctor.email ?? "",
              city: referralDoctor.city ?? "",
              address: referralDoctor.address ?? "",
              remarks: referralDoctor.remarks ?? "",
              marketingStaffId: referralDoctor.marketingStaffId ?? "",
              status: referralDoctor.status,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, referralDoctor, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      ...values,
      marketingStaffId: values.marketingStaffId ? values.marketingStaffId : null,
    };
    try {
      if (isEdit && referralDoctor) {
        await updateReferralDoctor.mutateAsync({ id: referralDoctor.id, values: payload });
        toast.success(`${values.doctorName} updated successfully`);
      } else {
        await createReferralDoctor.mutateAsync(payload);
        toast.success(`${values.doctorName} added to referral doctors`);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Referral Doctor" : "Add Referral Doctor"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="doctorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doctor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Dr. Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hospitalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hospital Name (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="City Hospital" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="speciality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Speciality (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Cardiology" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Mumbai" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Full address…" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notes…" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="marketingStaffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marketing Staff (optional)</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={staffOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Unassigned"
                      searchPlaceholder="Search staff…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border px-3.5 py-2.5">
                  <FormLabel className="cursor-pointer">Active</FormLabel>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <RippleButton type="submit" disabled={isPending}>
                {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Referral Doctor"}
              </RippleButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { ReferralDoctorFormDialog };

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePriceLists } from "@/hooks/queries/usePriceLists";
import {
  useCreateReferralSource,
  useUpdateReferralSource,
} from "@/hooks/queries/useReferralSources";
import {
  referralSourceFormSchema,
  type ReferralSourceFormSchemaType,
} from "@/schemas/referralSourceSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { fetchOrganizations } from "@/services/api/organization.api";
import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { MarketingStaff } from "@/types/marketingStaff";
import type { ReferralSource, ReferralType } from "@/types/referralSource";

const REFERRAL_TYPE_OPTIONS: { value: ReferralType; label: string }[] = [
  { value: "DOCTOR", label: "Doctor" },
  { value: "HOSPITAL", label: "Hospital" },
  { value: "CLINIC", label: "Clinic" },
  { value: "SELF", label: "Self" },
  { value: "CORPORATE", label: "Corporate" },
  { value: "OTHER", label: "Other" },
];

const DEFAULT_VALUES: ReferralSourceFormSchemaType = {
  referralType: "DOCTOR",
  name: "",
  organizationId: "",
  mobile: "",
  email: "",
  speciality: "",
  address: "",
  city: "",
  marketingStaffId: "",
  assignedPriceListId: "",
  commissionPercentage: 0,
  notes: "",
  status: true,
};

/**
 * Local fetch for the active organizations picker ("Hospital / Clinic").
 * Reuses the existing `organization.api.ts` list function — read-only usage,
 * no changes to that file.
 */
function useActiveOrganizationOptions() {
  return useQuery({
    queryKey: ["organizations", "active-picker"],
    queryFn: () => fetchOrganizations({ active: "true", pageSize: 100 }),
    staleTime: 60_000,
  });
}

/**
 * Local fetch for the active marketing staff picker. Mirrors the pattern
 * used in the (unrelated) Marketing Staff module's own form dialogs — this
 * hits the same `/marketing-staff/active` endpoint directly since there is
 * no shared hook for it yet.
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

interface ReferralFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralSource?: ReferralSource | null;
}

function ReferralFormDialog({ open, onOpenChange, referralSource }: ReferralFormDialogProps) {
  const isEdit = !!referralSource;
  const createReferralSource = useCreateReferralSource();
  const updateReferralSource = useUpdateReferralSource();
  const isPending = createReferralSource.isPending || updateReferralSource.isPending;

  const { data: organizations } = useActiveOrganizationOptions();
  const { data: staffList } = useActiveMarketingStaffOptions();
  const { data: priceListData } = usePriceLists({ active: "true", pageSize: 100 });

  const organizationOptions = (organizations?.rows ?? []).map((org) => ({
    value: org.id,
    label: org.name,
  }));
  const marketingStaffOptions = (staffList ?? []).map((staff) => ({
    value: staff.id,
    label: staff.name,
    description: staff.employeeCode,
  }));
  const priceListOptions = (priceListData?.rows ?? []).map((priceList) => ({
    value: priceList.id,
    label: priceList.name,
  }));

  const form = useForm<ReferralSourceFormSchemaType>({
    resolver: zodResolver(referralSourceFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        referralSource
          ? {
              referralType: referralSource.referralType,
              name: referralSource.name,
              organizationId: referralSource.organizationId ?? "",
              mobile: referralSource.mobile,
              email: referralSource.email ?? "",
              speciality: referralSource.speciality ?? "",
              address: referralSource.address ?? "",
              city: referralSource.city ?? "",
              marketingStaffId: referralSource.marketingStaffId ?? "",
              assignedPriceListId: referralSource.assignedPriceListId ?? "",
              commissionPercentage: referralSource.commissionPercentage,
              notes: referralSource.notes ?? "",
              status: referralSource.status,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, referralSource, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      ...values,
      organizationId: values.organizationId || null,
      email: values.email || null,
      speciality: values.speciality || null,
      address: values.address || null,
      city: values.city || null,
      marketingStaffId: values.marketingStaffId || null,
      assignedPriceListId: values.assignedPriceListId || null,
      notes: values.notes || null,
    };
    try {
      if (isEdit && referralSource) {
        await updateReferralSource.mutateAsync({ id: referralSource.id, values: payload });
        toast.success(`${values.name} updated successfully`);
      } else {
        await createReferralSource.mutateAsync(payload);
        toast.success(`${values.name} added as a referral source`);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Referral" : "Add Referral"}</DialogTitle>
        </DialogHeader>

        {isEdit && referralSource && (
          <p className="-mt-2 text-xs text-muted-foreground">
            Referral Code: <span className="font-mono">{referralSource.referralCode}</span>
          </p>
        )}

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="referralType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REFERRAL_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Dr. John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hospital / Clinic (optional)</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={organizationOptions}
                      value={field.value || undefined}
                      onChange={field.onChange}
                      placeholder="Select hospital / clinic"
                      searchPlaceholder="Search organizations…"
                    />
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
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile</FormLabel>
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
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Street address…" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              name="marketingStaffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marketing Staff (optional)</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={marketingStaffOptions}
                      value={field.value || undefined}
                      onChange={field.onChange}
                      placeholder="Select marketing staff"
                      searchPlaceholder="Search staff…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignedPriceListId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Price List (optional)</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={priceListOptions}
                      value={field.value || undefined}
                      onChange={field.onChange}
                      placeholder="Select price list"
                      searchPlaceholder="Search price lists…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="commissionPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission %</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={100} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes…" rows={2} {...field} />
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
                {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Referral"}
              </RippleButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { ReferralFormDialog };

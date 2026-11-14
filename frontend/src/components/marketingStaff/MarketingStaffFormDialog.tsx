import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { DatePicker } from "@/components/common/DatePicker";
import { RippleButton } from "@/components/common/RippleButton";
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
import {
  useCreateMarketingStaff,
  useUpdateMarketingStaff,
} from "@/hooks/queries/useMarketingStaff";
import {
  marketingStaffFormSchema,
  type MarketingStaffFormSchemaType,
} from "@/schemas/marketingStaffSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { MarketingStaff } from "@/types/marketingStaff";

const DEFAULT_VALUES: MarketingStaffFormSchemaType = {
  employeeCode: "",
  name: "",
  mobile: "",
  email: "",
  designation: "",
  joiningDate: "",
  status: true,
};

interface MarketingStaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketingStaff?: MarketingStaff | null;
}

function MarketingStaffFormDialog({
  open,
  onOpenChange,
  marketingStaff,
}: MarketingStaffFormDialogProps) {
  const isEdit = !!marketingStaff;
  const createMarketingStaff = useCreateMarketingStaff();
  const updateMarketingStaff = useUpdateMarketingStaff();
  const isPending = createMarketingStaff.isPending || updateMarketingStaff.isPending;

  const form = useForm<MarketingStaffFormSchemaType>({
    resolver: zodResolver(marketingStaffFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        marketingStaff
          ? {
              employeeCode: marketingStaff.employeeCode,
              name: marketingStaff.name,
              mobile: marketingStaff.mobile,
              email: marketingStaff.email ?? "",
              designation: marketingStaff.designation ?? "",
              joiningDate: marketingStaff.joiningDate.slice(0, 10),
              status: marketingStaff.status,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, marketingStaff, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit && marketingStaff) {
        await updateMarketingStaff.mutateAsync({ id: marketingStaff.id, values });
        toast.success(`${values.name} updated successfully`);
      } else {
        await createMarketingStaff.mutateAsync(values);
        toast.success(`${values.name} added to marketing staff`);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Marketing Staff" : "Add Marketing Staff"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="employeeCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Code</FormLabel>
                  <FormControl>
                    <Input placeholder="MKT-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
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
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Field Executive" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="joiningDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Joining Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? "")}
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
                {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Marketing Staff"}
              </RippleButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { MarketingStaffFormDialog };

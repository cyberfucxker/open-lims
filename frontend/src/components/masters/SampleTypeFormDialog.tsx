import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

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
import { Textarea } from "@/components/ui/textarea";
import { useCreateSampleType, useUpdateSampleType } from "@/hooks/queries/useSampleTypes";
import { sampleTypeFormSchema, type SampleTypeFormSchemaType } from "@/schemas/masterSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { SampleType } from "@/types/master";

const DEFAULT_VALUES: SampleTypeFormSchemaType = {
  name: "",
  description: "",
  active: true,
};

interface SampleTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sampleType?: SampleType | null;
}

function SampleTypeFormDialog({ open, onOpenChange, sampleType }: SampleTypeFormDialogProps) {
  const isEdit = !!sampleType;
  const createSampleType = useCreateSampleType();
  const updateSampleType = useUpdateSampleType();
  const isPending = createSampleType.isPending || updateSampleType.isPending;

  const form = useForm<SampleTypeFormSchemaType>({
    resolver: zodResolver(sampleTypeFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        sampleType
          ? {
              name: sampleType.name,
              description: sampleType.description ?? "",
              active: sampleType.active,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, sampleType, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit && sampleType) {
        await updateSampleType.mutateAsync({ id: sampleType.id, values });
        toast.success(`${values.name} updated successfully`);
      } else {
        await createSampleType.mutateAsync(values);
        toast.success(`${values.name} added to sample types`);
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
          <DialogTitle>{isEdit ? "Edit Sample Type" : "Add Sample Type"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample Type Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Blood" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Short description…" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="active"
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
                {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Sample Type"}
              </RippleButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { SampleTypeFormDialog };

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { RippleButton } from "@/components/common/RippleButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { useRejectSample } from "@/hooks/queries/useSamples";
import { rejectSampleFormSchema, type RejectSampleFormSchemaType } from "@/schemas/sampleSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { SampleRecord } from "@/types/sample";

interface SampleRejectDialogProps {
  sample: SampleRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SampleRejectDialog({ sample, open, onOpenChange }: SampleRejectDialogProps) {
  const rejectSample = useRejectSample();

  const form = useForm<RejectSampleFormSchemaType>({
    resolver: zodResolver(rejectSampleFormSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (open) form.reset({ reason: "" });
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!sample) return;
    try {
      await rejectSample.mutateAsync({ id: sample.id, input: values });
      toast.success(`${sample.sampleNo} rejected`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to reject sample");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Sample {sample?.sampleNo}</DialogTitle>
          <DialogDescription>
            This sample and its tests will be blocked from report entry until a reason is recorded.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rejection Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Hemolyzed specimen, insufficient volume…"
                      rows={3}
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <RippleButton
                type="submit"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={rejectSample.isPending}
              >
                {rejectSample.isPending ? "Rejecting…" : "Reject Sample"}
              </RippleButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { SampleRejectDialog };

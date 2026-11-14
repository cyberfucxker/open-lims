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
import { useRejectReport } from "@/hooks/queries/useReports";
import { rejectReportFormSchema, type RejectReportFormSchemaType } from "@/schemas/reportSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { ReportDetails } from "@/types/report";

interface ReportRejectDialogProps {
  report: ReportDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ReportRejectDialog({ report, open, onOpenChange }: ReportRejectDialogProps) {
  const rejectReport = useRejectReport();

  const form = useForm<RejectReportFormSchemaType>({
    resolver: zodResolver(rejectReportFormSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (open) form.reset({ reason: "" });
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!report) return;
    try {
      await rejectReport.mutateAsync({ id: report.id, input: values });
      toast.success(`${report.reportNo} sent back for revision`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to send back report");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Back Report {report?.reportNo}</DialogTitle>
          <DialogDescription>
            The report returns to Processing so the technician can correct results.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Result out of expected range, re-verify…"
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
                disabled={rejectReport.isPending}
              >
                {rejectReport.isPending ? "Sending…" : "Send Back"}
              </RippleButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { ReportRejectDialog };

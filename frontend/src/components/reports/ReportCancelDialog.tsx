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
import { Textarea } from "@/components/ui/textarea";
import { useCancelReport } from "@/hooks/queries/useReports";
import { cancelReportFormSchema, type CancelReportFormSchemaType } from "@/schemas/reportSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { ReportDetails } from "@/types/report";

interface ReportCancelDialogProps {
  report: ReportDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ReportCancelDialog({ report, open, onOpenChange }: ReportCancelDialogProps) {
  const cancelReport = useCancelReport();

  const form = useForm<CancelReportFormSchemaType>({
    resolver: zodResolver(cancelReportFormSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (open) form.reset({ reason: "" });
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!report) return;
    try {
      await cancelReport.mutateAsync({ id: report.id, input: values });
      toast.success(`${report.reportNo} cancelled`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to cancel report");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Report {report?.reportNo}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Duplicate order, patient cancelled…"
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
                Keep Report
              </Button>
              <RippleButton
                type="submit"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={cancelReport.isPending}
              >
                {cancelReport.isPending ? "Cancelling…" : "Cancel Report"}
              </RippleButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { ReportCancelDialog };

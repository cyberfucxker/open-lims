import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { DatePicker } from "@/components/common/DatePicker";
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
import { Textarea } from "@/components/ui/textarea";
import { useGenerateSettlement } from "@/hooks/queries/useReferralSettlements";
import {
  generateSettlementFormSchema,
  type GenerateSettlementFormSchemaType,
} from "@/schemas/referralSettlementSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { ReferralSource } from "@/types/referralSource";

const DEFAULT_VALUES: GenerateSettlementFormSchemaType = {
  referralSourceId: "",
  fromDate: "",
  toDate: "",
  adjustment: 0,
  remarks: "",
};

interface GenerateSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultReferralSourceId?: string;
}

function GenerateSettlementDialog({
  open,
  onOpenChange,
  defaultReferralSourceId,
}: GenerateSettlementDialogProps) {
  const generateSettlement = useGenerateSettlement();

  const { data: referralSources } = useQuery({
    queryKey: ["referralSources", "all"],
    queryFn: async () => {
      const response = await httpClient.get<ApiResponseBody<ReferralSource[]>>(
        "/referral-sources/all",
        { suppressErrorToast: true },
      );
      return response.data.data as ReferralSource[];
    },
    enabled: open,
  });

  const referralOptions = useMemo(
    () =>
      (referralSources ?? []).map((source) => ({
        value: source.id,
        label: source.name,
        description: source.referralCode,
      })),
    [referralSources],
  );

  const form = useForm<GenerateSettlementFormSchemaType>({
    resolver: zodResolver(generateSettlementFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset({
        ...DEFAULT_VALUES,
        referralSourceId: defaultReferralSourceId ?? "",
      });
    }
  }, [open, defaultReferralSourceId, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await generateSettlement.mutateAsync({
        referralSourceId: values.referralSourceId,
        fromDate: values.fromDate,
        toDate: values.toDate,
        adjustment: values.adjustment || undefined,
        remarks: values.remarks || undefined,
      });
      toast.success("Settlement generated successfully");
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
          <DialogTitle>Generate Settlement</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="referralSourceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={referralOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select referral source"
                      searchPlaceholder="Search referral sources…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="fromDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? "")}
                        placeholder="From date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="toDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? "")}
                        placeholder="To date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="adjustment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      {...field}
                      value={field.value ?? 0}
                    />
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
                    <Textarea placeholder="Any notes for this settlement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <RippleButton type="submit" disabled={generateSettlement.isPending}>
                {generateSettlement.isPending ? "Generating…" : "Generate Settlement"}
              </RippleButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { GenerateSettlementDialog };

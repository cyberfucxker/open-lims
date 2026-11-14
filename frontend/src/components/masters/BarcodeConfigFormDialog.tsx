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
import { useUpsertSampleTypeBarcodeConfig } from "@/hooks/queries/useSampleTypeBarcodeConfigs";
import { barcodeConfigFormSchema, type BarcodeConfigFormSchemaType } from "@/schemas/masterSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { SampleTypeBarcodeConfig } from "@/types/master";

interface BarcodeConfigFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: SampleTypeBarcodeConfig | null;
}

function BarcodeConfigFormDialog({ open, onOpenChange, config }: BarcodeConfigFormDialogProps) {
  const upsert = useUpsertSampleTypeBarcodeConfig();

  const form = useForm<BarcodeConfigFormSchemaType>({
    resolver: zodResolver(barcodeConfigFormSchema),
    defaultValues: { prefix: "", numberLength: 6, active: true },
  });

  useEffect(() => {
    if (open && config) {
      form.reset({
        prefix: config.prefix ?? "",
        numberLength: config.numberLength,
        active: config.active,
      });
    }
  }, [open, config, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!config) return;
    try {
      await upsert.mutateAsync({ sampleTypeId: config.sampleTypeId, values });
      toast.success(`Barcode settings saved for ${config.sampleTypeName}`);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  });

  const preview = `${form.watch("prefix") || "PRE"}${"1".padStart(form.watch("numberLength") || 6, "0")}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Barcode Settings — {config?.sampleTypeName}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prefix</FormLabel>
                    <FormControl>
                      <Input placeholder="BLD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number Length</FormLabel>
                    <FormControl>
                      <Input type="number" min={4} max={12} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Preview: <span className="font-mono font-medium text-foreground">{preview}</span>
            </p>

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
              <RippleButton type="submit" disabled={upsert.isPending}>
                {upsert.isPending ? "Saving…" : "Save Settings"}
              </RippleButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { BarcodeConfigFormDialog };

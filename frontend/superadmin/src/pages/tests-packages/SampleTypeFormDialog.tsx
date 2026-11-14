import { useEffect, useState } from "react";
import { Info } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateSampleType,
  useUpdateSampleType,
  useUpsertSampleTypeBarcodeConfig,
} from "@/hooks/queries/useSampleTypes";
import type { SampleTypeDto } from "@/services/api/sampleTypeApi";

interface SampleTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sampleType: SampleTypeDto | null;
  /** Existing barcode prefix for this type, if one is configured. */
  barcodePrefix: string | null;
  barcodeNumberLength: number;
}

interface FormState {
  name: string;
  description: string;
  active: boolean;
  prefix: string;
  numberLength: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  active: true,
  prefix: "",
  numberLength: "6",
};

function SampleTypeFormDialog({
  open,
  onOpenChange,
  sampleType,
  barcodePrefix,
  barcodeNumberLength,
}: SampleTypeFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const createSampleType = useCreateSampleType();
  const updateSampleType = useUpdateSampleType();
  const upsertBarcodeConfig = useUpsertSampleTypeBarcodeConfig();
  const isSaving =
    createSampleType.isPending || updateSampleType.isPending || upsertBarcodeConfig.isPending;

  useEffect(() => {
    if (!open) return;
    if (sampleType) {
      setForm({
        name: sampleType.name,
        description: sampleType.description ?? "",
        active: sampleType.active,
        prefix: barcodePrefix ?? "",
        numberLength: String(barcodeNumberLength || 6),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, sampleType, barcodePrefix, barcodeNumberLength]);

  const trimmedPrefix = form.prefix.trim();
  // Mirrors the server's own rule (`upsertSampleTypeBarcodeConfigValidation`) so
  // the admin sees it inline rather than as a 400 after saving the type.
  const prefixInvalid = trimmedPrefix.length > 0 && !/^[A-Za-z0-9]{1,10}$/.test(trimmedPrefix);
  const numberLengthNum = Number(form.numberLength);
  const numberLengthInvalid =
    !Number.isInteger(numberLengthNum) || numberLengthNum < 4 || numberLengthNum > 12;

  const isValid =
    form.name.trim().length > 1 && !prefixInvalid && (!trimmedPrefix || !numberLengthInvalid);

  async function handleSubmit() {
    if (!isValid) {
      toast.error(
        prefixInvalid
          ? "Barcode prefix must be 1–10 letters or digits."
          : numberLengthInvalid && trimmedPrefix
            ? "Number length must be between 4 and 12."
            : "Enter a sample type name before saving.",
      );
      return;
    }

    const values = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      active: form.active,
    };

    try {
      // Sequential, not parallel: the barcode config is keyed on the sample
      // type's id, which for a new type doesn't exist until the first call
      // returns.
      const saved = sampleType
        ? await updateSampleType.mutateAsync({ id: sampleType.id, values })
        : await createSampleType.mutateAsync(values);

      if (trimmedPrefix) {
        await upsertBarcodeConfig.mutateAsync({
          sampleTypeId: saved.id,
          values: { prefix: trimmedPrefix, numberLength: numberLengthNum, active: true },
        });
      }

      toast.success(
        sampleType ? "Sample type updated successfully." : "Sample type created successfully.",
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{sampleType ? "Edit Sample Type" : "Add Sample Type"}</DialogTitle>
          <DialogDescription>
            {sampleType
              ? "Update this specimen type. Every test collected as this type picks up the change."
              : "Create a specimen type that tests can be collected as."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-name">Name *</Label>
            <Input
              id="st-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="EDTA Whole Blood"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-description">Description</Label>
            <Textarea
              id="st-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Whole blood in EDTA (lavender top)."
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
            <Label>Barcode Numbering</Label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="st-prefix" className="text-xs text-muted-foreground">
                  Prefix
                </Label>
                <Input
                  id="st-prefix"
                  value={form.prefix}
                  onChange={(e) => setForm((f) => ({ ...f, prefix: e.target.value }))}
                  placeholder="EDT"
                  aria-invalid={prefixInvalid}
                />
                {prefixInvalid && (
                  <p className="text-xs text-destructive">Use 1–10 letters or digits only.</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="st-number-length" className="text-xs text-muted-foreground">
                  Number Length
                </Label>
                <Input
                  id="st-number-length"
                  type="number"
                  min={4}
                  max={12}
                  value={form.numberLength}
                  onChange={(e) => setForm((f) => ({ ...f, numberLength: e.target.value }))}
                  aria-invalid={!!trimmedPrefix && numberLengthInvalid}
                />
                {!!trimmedPrefix && numberLengthInvalid && (
                  <p className="text-xs text-destructive">Must be between 4 and 12.</p>
                )}
              </div>
            </div>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3 shrink-0" />
              {trimmedPrefix && !prefixInvalid && !numberLengthInvalid
                ? `Samples will be numbered ${trimmedPrefix}${"0".repeat(Math.max(numberLengthNum - 1, 0))}1 onwards.`
                : "Required before samples of this type can be collected — sample numbering has no prefix to use without it."}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div className="pr-4">
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive sample types can't be picked for new tests. Existing tests keep working.
              </p>
            </div>
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : sampleType ? "Save Changes" : "Create Sample Type"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { SampleTypeFormDialog };

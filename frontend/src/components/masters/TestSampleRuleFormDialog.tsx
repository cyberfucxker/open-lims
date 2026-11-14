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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useContainers } from "@/hooks/queries/useContainers";
import { useUpsertTestSampleRule } from "@/hooks/queries/useTestSampleRules";
import {
  testSampleRuleFormSchema,
  type TestSampleRuleFormSchemaType,
} from "@/schemas/masterSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { TestSampleRule } from "@/types/master";

const DEFAULT_VALUES: TestSampleRuleFormSchemaType = {
  containerId: "",
  requiresFasting: false,
  fastingHours: undefined,
  isStatAllowed: true,
  temperatureRequirement: "ROOM_TEMPERATURE",
  minVolumeMl: undefined,
  volumeUnit: "mL",
  preparationInstructions: "",
  collectionInstructions: "",
  postCollectionInstructions: "",
};

const TEMPERATURE_OPTIONS: {
  value: TestSampleRuleFormSchemaType["temperatureRequirement"];
  label: string;
}[] = [
  { value: "ROOM_TEMPERATURE", label: "Room Temperature" },
  { value: "REFRIGERATED_2_8", label: "Refrigerated (2-8°C)" },
  { value: "FROZEN_MINUS20", label: "Frozen (-20°C)" },
  { value: "FROZEN_MINUS80", label: "Frozen (-80°C)" },
];

interface TestSampleRuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: TestSampleRule | null;
}

function TestSampleRuleFormDialog({ open, onOpenChange, rule }: TestSampleRuleFormDialogProps) {
  const upsert = useUpsertTestSampleRule();
  const { data: containersData } = useContainers({ active: "true", pageSize: 100 });

  const form = useForm<TestSampleRuleFormSchemaType>({
    resolver: zodResolver(testSampleRuleFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        rule?.rule
          ? {
              containerId: rule.rule.containerId ?? "",
              requiresFasting: rule.rule.requiresFasting,
              fastingHours: rule.rule.fastingHours ?? undefined,
              isStatAllowed: rule.rule.isStatAllowed,
              temperatureRequirement: rule.rule.temperatureRequirement,
              minVolumeMl: rule.rule.minVolumeMl ?? undefined,
              volumeUnit: rule.rule.volumeUnit,
              preparationInstructions: rule.rule.preparationInstructions ?? "",
              collectionInstructions: rule.rule.collectionInstructions ?? "",
              postCollectionInstructions: rule.rule.postCollectionInstructions ?? "",
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, rule, form]);

  const requiresFasting = form.watch("requiresFasting");

  const onSubmit = form.handleSubmit(async (values) => {
    if (!rule) return;
    try {
      await upsert.mutateAsync({ testId: rule.testId, values });
      toast.success(`Sample rule saved for ${rule.testName}`);
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Sample Rule — {rule?.testName}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="containerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Container</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select container" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {containersData?.rows.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
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
                name="temperatureRequirement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TEMPERATURE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="minVolumeMl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Volume</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        placeholder="3"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="volumeUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="mL" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-6 rounded-lg border border-border px-3.5 py-2.5">
              <FormField
                control={form.control}
                name="requiresFasting"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormLabel className="cursor-pointer">Fasting Required</FormLabel>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isStatAllowed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormLabel className="cursor-pointer">STAT Allowed</FormLabel>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormItem>
                )}
              />
            </div>

            {requiresFasting && (
              <FormField
                control={form.control}
                name="fastingHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fasting Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={72}
                        placeholder="10"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="preparationInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preparation Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Patient preparation before collection…"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="collectionInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection Instructions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="How to collect the specimen…" rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postCollectionInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post Collection Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Storage/transport after collection…"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <RippleButton type="submit" disabled={upsert.isPending}>
                {upsert.isPending ? "Saving…" : "Save Rule"}
              </RippleButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { TestSampleRuleFormDialog };

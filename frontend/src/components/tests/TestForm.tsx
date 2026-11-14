import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FileText, FlaskConical, Tag } from "lucide-react";

import { FormSection } from "@/components/common/FormSection";
import { RippleButton } from "@/components/common/RippleButton";
import { SuccessAnimation } from "@/components/common/SuccessAnimation";
import { Button } from "@/components/ui/button";
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
import { REPORT_TIME_PRESETS } from "@/data/sampleTypes";
import { useCategories } from "@/hooks/queries/useCategories";
import { useDepartments } from "@/hooks/queries/useDepartments";
import { useSampleTypes } from "@/hooks/queries/useSampleTypes";
import { useCreateTest, useUpdateTest } from "@/hooks/queries/useTests";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { testFormSchema, type TestFormSchemaType } from "@/schemas/testSchema";
import type { LabTest } from "@/types/test";

const DEFAULT_VALUES: TestFormSchemaType = {
  name: "",
  shortName: "",
  departmentId: "",
  categoryId: "",
  price: 0,
  sampleTypeId: "",
  reportTime: "",
  referenceRange: "",
  status: "Active",
  description: "",
};

interface TestFormProps {
  mode: "create" | "edit";
  test?: LabTest;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function TestForm({ mode, test, onSuccess, onCancel }: TestFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const createTest = useCreateTest();
  const updateTest = useUpdateTest();
  const isPending = createTest.isPending || updateTest.isPending;

  const { data: departmentsData } = useDepartments({ active: "true", pageSize: 100 });
  const { data: sampleTypesData } = useSampleTypes({ active: "true", pageSize: 100 });

  const form = useForm<TestFormSchemaType>({
    resolver: zodResolver(testFormSchema),
    defaultValues: test
      ? {
          name: test.name,
          shortName: test.shortName,
          departmentId: test.departmentId ?? "",
          categoryId: test.categoryId ?? "",
          price: test.price,
          sampleTypeId: test.sampleTypeId ?? "",
          reportTime: test.reportTime,
          referenceRange: test.referenceRange,
          status: test.status,
          description: test.description,
        }
      : DEFAULT_VALUES,
  });

  const selectedDepartmentId = form.watch("departmentId");
  const { data: categoriesData } = useCategories(
    { departmentId: selectedDepartmentId, active: "true", pageSize: 100 },
    { enabled: !!selectedDepartmentId },
  );

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (mode === "edit" && test) {
        await updateTest.mutateAsync({ id: test.id, values });
        toast.success(`${values.name} updated successfully`);
        onSuccess?.();
      } else {
        await createTest.mutateAsync(values);
        setShowSuccess(true);
        toast.success(`${values.name} added to the test catalogue`);
        window.setTimeout(() => {
          setShowSuccess(false);
          form.reset(DEFAULT_VALUES);
          onSuccess?.();
        }, 1400);
      }
    } catch (error) {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="relative flex flex-col gap-5">
        <SuccessAnimation
          open={showSuccess}
          title="Test Added!"
          description="The test has been added to the catalogue."
        />

        <FormSection
          title="Test Identity"
          description="Name and classification"
          icon={FlaskConical}
          index={0}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Test Name</FormLabel>
                <FormControl>
                  <Input placeholder="Complete Blood Count" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shortName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Name</FormLabel>
                <FormControl>
                  <Input placeholder="CBC" {...field} />
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
                <Switch
                  checked={field.value === "Active"}
                  onCheckedChange={(checked) => field.onChange(checked ? "Active" : "Inactive")}
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("categoryId", "");
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departmentsData?.rows.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
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
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!selectedDepartmentId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          selectedDepartmentId ? "Select category" : "Select department first"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoriesData?.rows.map((c) => (
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
        </FormSection>

        <FormSection
          title="Sample & Pricing"
          description="Collection and billing details"
          icon={Tag}
          index={1}
        >
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₹)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sampleTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sample Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sample type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sampleTypesData?.rows.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
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
            name="reportTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Report Time</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {REPORT_TIME_PRESETS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection
          title="Clinical Details"
          description="Reference range and description"
          icon={FileText}
          index={2}
        >
          <FormField
            control={form.control}
            name="referenceRange"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Reference Range</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g. Hb: 13-17 g/dL (M), 12-15 g/dL (F)"
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Short description of what this test evaluates…"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <div className="flex justify-end gap-2.5">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <RippleButton type="submit" disabled={isPending}>
            {isPending ? "Saving…" : mode === "edit" ? "Save Changes" : "Add Test"}
          </RippleButton>
        </div>
      </form>
    </Form>
  );
}

export { TestForm };

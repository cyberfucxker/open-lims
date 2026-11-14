import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Package as PackageIcon, Search } from "lucide-react";

import { RippleButton } from "@/components/common/RippleButton";
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
import { useTests } from "@/hooks/queries/useTests";
import { useCreatePackage, useUpdatePackage } from "@/hooks/queries/usePackages";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { packageFormSchema, type PackageFormSchemaType } from "@/schemas/packageSchema";
import type { LabPackage } from "@/types/package";

const DEFAULT_VALUES: PackageFormSchemaType = {
  name: "",
  price: 0,
  testIds: [],
};

interface PackageFormProps {
  mode: "create" | "edit";
  pkg?: LabPackage;
  onSuccess: () => void;
  onCancel: () => void;
}

function PackageForm({ mode, pkg, onSuccess, onCancel }: PackageFormProps) {
  const [search, setSearch] = useState("");
  const { data: testsData, isLoading: isLoadingTests } = useTests({
    status: "Active",
    pageSize: 100,
  });
  const tests = useMemo(() => testsData?.rows ?? [], [testsData]);

  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const isPending = createPackage.isPending || updatePackage.isPending;

  const form = useForm<PackageFormSchemaType>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: pkg
      ? { name: pkg.name, price: pkg.price, testIds: pkg.tests.map((t) => t.testId) }
      : DEFAULT_VALUES,
  });

  const testIds = form.watch("testIds");

  const testById = useMemo(() => new Map(tests.map((t) => [t.id, t])), [tests]);

  const availableTests = useMemo(
    () =>
      tests.filter(
        (t) => !testIds.includes(t.id) && t.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [tests, testIds, search],
  );

  const selectedTests = useMemo(
    () => testIds.map((id) => testById.get(id)).filter((t) => t !== undefined),
    [testIds, testById],
  );

  const addTest = (id: string) => {
    form.setValue("testIds", [...testIds, id], { shouldValidate: true });
  };
  const removeTest = (id: string) => {
    form.setValue(
      "testIds",
      testIds.filter((t) => t !== id),
      { shouldValidate: true },
    );
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (mode === "edit" && pkg) {
        await updatePackage.mutateAsync({ id: pkg.id, values });
        toast.success(`${values.name} updated successfully`);
      } else {
        await createPackage.mutateAsync(values);
        toast.success(`${values.name} added to the package catalogue`);
      }
      onSuccess();
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
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <h3 className="w-fit border-b-2 border-primary pb-1 text-base font-semibold text-primary">
          {mode === "edit" ? `Editing: ${pkg?.name}` : "Create New Package"}
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Package Name</FormLabel>
                <FormControl>
                  <Input placeholder="Package Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="Amount" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-navy-950">
                <PackageIcon className="size-4 text-primary" /> Available Tests
              </h4>
            </div>
            <div className="p-3">
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search test…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
                {isLoadingTests ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Loading tests…</p>
                ) : availableTests.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No tests found.</p>
                ) : (
                  availableTests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <span className="truncate text-sm text-foreground">{test.name}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
                        onClick={() => addTest(test.id)}
                      >
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-navy-950">
                <PackageIcon className="size-4 text-primary" /> Tests in Package
              </h4>
            </div>
            <div className="p-3">
              <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
                {selectedTests.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No tests added yet.
                  </p>
                ) : (
                  selectedTests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <span className="truncate text-sm text-foreground">{test.name}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeTest(test.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>
              {form.formState.errors.testIds && (
                <p className="mt-2 text-sm text-destructive">
                  {form.formState.errors.testIds.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <RippleButton type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save Package"}
          </RippleButton>
        </div>
      </form>
    </Form>
  );
}

export { PackageForm };

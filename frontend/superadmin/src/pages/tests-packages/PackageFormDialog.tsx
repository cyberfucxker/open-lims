import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Info, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { RichTextEditor } from "@/components/common/RichTextEditor";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/format";
import { useAppCategories } from "@/hooks/queries/useAppCategories";
import { useSampleTypes } from "@/hooks/queries/useMasterData";
import {
  useCreatePackage,
  useRemovePackageSampleReport,
  useUpdatePackage,
  useUploadPackageSampleReport,
} from "@/hooks/queries/usePackages";
import { useAllParameters } from "@/hooks/queries/useParameters";
import { useTests } from "@/hooks/queries/useTests";
import { uploadCmsImageApi } from "@/services/api/cmsPageApi";
import type { PackageDto, PackageFormValues } from "@/services/api/packageApi";
import { RECOMMENDED_GENDER_LABELS, type RecommendedGender } from "@/services/api/parameterApi";
import { cn } from "@/utils/cn";

import { MultiSelect } from "./MultiSelect";

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg: PackageDto | null;
}

interface FormState {
  name: string;
  appCategoryId: string;
  sampleTypeId: string;
  price: string;
  offerPrice: string;
  description: string;
  reportTime: string;
  isFastingRequired: boolean;
  fastingHours: string;
  followUpDays: string;
  followUpTemplate: string;
  recommendedFor: RecommendedGender;
  recommendedAge: string;
  testIds: string[];
  parameterIds: string[];
  active: boolean;
  isPopular: boolean;
  /** The "N people booked this" number the patient app shows, and what its
   *  package list sorts by — a plain admin-set display number, not derived
   *  from real orders. */
  bookedCount: string;
  /** Manual display order for THIS list only (ascending) — the patient app's
   *  own catalogue still sorts by Booking Count above. */
  sortOrder: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  appCategoryId: "",
  sampleTypeId: "",
  price: "",
  offerPrice: "",
  description: "",
  reportTime: "",
  isFastingRequired: false,
  fastingHours: "",
  followUpDays: "",
  followUpTemplate: "",
  recommendedFor: "BOTH",
  recommendedAge: "",
  testIds: [],
  parameterIds: [],
  active: true,
  isPopular: false,
  bookedCount: "0",
  sortOrder: "0",
};

const RECOMMENDED_GENDER_OPTIONS: RecommendedGender[] = ["MALE", "FEMALE", "BOTH"];

function PackageFormDialog({ open, onOpenChange, pkg }: PackageFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: sampleTypesResult, isLoading: sampleTypesLoading } = useSampleTypes();
  const sampleTypes = (sampleTypesResult?.rows ?? []).filter((s) => s.active);

  const { data: appCategoriesResult, isLoading: appCategoriesLoading } = useAppCategories({
    page: 1,
    pageSize: 100,
  });
  const appCategories = (appCategoriesResult?.rows ?? []).filter((c) => c.isActive);

  // Only Active tests can be bundled, so the picker shows only those — matching
  // what `catalogShortName.ts#assertTestIdsUsable` will accept.
  const { data: testsResult } = useTests({ status: "Active", page: 1, pageSize: 500 });
  const tests = useMemo(() => testsResult?.rows ?? [], [testsResult]);

  // `doTest: "true"` is not cosmetic filtering: a package may only pull in
  // independently-bookable analytes, and the API rejects the rest. Showing
  // non-bookable ones here would only offer choices that can't be saved.
  // Pages through the whole catalogue so nothing past the first 500 is dropped.
  const { data: allBookableParameters } = useAllParameters({
    doTest: "true",
    active: "true",
  });
  const parameters = useMemo(() => allBookableParameters ?? [], [allBookableParameters]);

  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const uploadSampleReport = useUploadPackageSampleReport();
  const removeSampleReport = useRemovePackageSampleReport();
  const isSaving = createPackage.isPending || updatePackage.isPending;

  useEffect(() => {
    if (!open) return;
    if (pkg) {
      setForm({
        name: pkg.name,
        appCategoryId: pkg.appCategoryId ?? "",
        sampleTypeId: pkg.sampleTypeId ?? "",
        price: String(pkg.price),
        offerPrice: pkg.offerPrice != null ? String(pkg.offerPrice) : "",
        description: pkg.description ?? "",
        reportTime: pkg.reportTime ?? "",
        isFastingRequired: pkg.isFastingRequired,
        fastingHours: pkg.fastingHours != null ? String(pkg.fastingHours) : "",
        followUpDays: pkg.followUpDays != null ? String(pkg.followUpDays) : "",
        followUpTemplate: pkg.followUpTemplate ?? "",
        recommendedFor: pkg.recommendedFor,
        recommendedAge: pkg.recommendedAge ?? "",
        testIds: pkg.tests.map((t) => t.testId),
        parameterIds: pkg.parameters.map((p) => p.parameterId),
        active: pkg.active,
        isPopular: pkg.isPopular,
        bookedCount: String(pkg.bookedCount),
        sortOrder: String(pkg.sortOrder),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, pkg]);

  const sumOfMembers = useMemo(() => {
    const testSum = form.testIds.reduce(
      (sum, id) => sum + (tests.find((t) => t.id === id)?.price ?? 0),
      0,
    );
    const parameterSum = form.parameterIds.reduce(
      (sum, id) => sum + (parameters.find((p) => p.id === id)?.price ?? 0),
      0,
    );
    return testSum + parameterSum;
  }, [form.testIds, form.parameterIds, tests, parameters]);

  const priceNum = Number(form.price) || 0;
  const offerPriceNum = form.offerPrice.trim() ? Number(form.offerPrice) : null;
  const offerPriceTooHigh = offerPriceNum !== null && priceNum > 0 && offerPriceNum > priceNum;

  const fastingHoursNum = form.fastingHours.trim() ? Number(form.fastingHours) : null;
  const fastingHoursInvalid =
    form.isFastingRequired &&
    fastingHoursNum !== null &&
    (!Number.isInteger(fastingHoursNum) || fastingHoursNum < 1 || fastingHoursNum > 48);

  const savingsPct =
    sumOfMembers > 0 && priceNum > 0 ? Math.round((1 - priceNum / sumOfMembers) * 100) : null;

  const memberCount = form.testIds.length + form.parameterIds.length;
  const bookedCountNum = form.bookedCount.trim() ? Number(form.bookedCount) : 0;
  const bookedCountInvalid = !Number.isInteger(bookedCountNum) || bookedCountNum < 0;
  const sortOrderNum = form.sortOrder.trim() ? Number(form.sortOrder) : 0;
  const sortOrderInvalid = !Number.isInteger(sortOrderNum) || sortOrderNum < 0;

  const isValid =
    form.name.trim().length > 1 &&
    memberCount > 0 &&
    priceNum > 0 &&
    !offerPriceTooHigh &&
    !fastingHoursInvalid &&
    !bookedCountInvalid &&
    !sortOrderInvalid;

  function handleSubmit() {
    if (!isValid) {
      toast.error(
        offerPriceTooHigh
          ? "Offer price can't be higher than the price."
          : fastingHoursInvalid
            ? "Fasting hours must be between 1 and 48."
            : bookedCountInvalid
              ? "Booking count must be a whole number, 0 or more."
              : sortOrderInvalid
                ? "Sort order must be a whole number, 0 or more."
                : "Add a name, a price, and at least one test or bookable parameter.",
      );
      return;
    }
    const values: PackageFormValues = {
      name: form.name.trim(),
      appCategoryId: form.appCategoryId || null,
      sampleTypeId: form.sampleTypeId || null,
      price: priceNum,
      offerPrice: offerPriceNum,
      description: form.description.trim() || null,
      reportTime: form.reportTime.trim() || null,
      isFastingRequired: form.isFastingRequired,
      // Cleared when fasting isn't required — the server rejects hours without
      // the flag rather than quietly ignoring them.
      fastingHours: form.isFastingRequired ? fastingHoursNum : null,
      followUpDays: form.followUpDays.trim() ? Number(form.followUpDays) : null,
      followUpTemplate: form.followUpTemplate.trim() || null,
      recommendedFor: form.recommendedFor,
      recommendedAge: form.recommendedAge.trim() || null,
      testIds: form.testIds,
      parameterIds: form.parameterIds,
      active: form.active,
      isPopular: form.isPopular,
      bookedCount: bookedCountNum,
      sortOrder: sortOrderNum,
    };

    const onSettled = {
      onSuccess: () => {
        toast.success(pkg ? "Package updated successfully." : "Package created successfully.");
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Something went wrong.");
      },
    };

    if (pkg) {
      updatePackage.mutate({ id: pkg.id, values }, onSettled);
    } else {
      createPackage.mutate(values, onSettled);
    }
  }

  function handleReportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !pkg) return;
    uploadSampleReport.mutate(
      { id: pkg.id, file },
      {
        onSuccess: () => toast.success("Sample report uploaded."),
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to upload sample report.");
        },
      },
    );
  }

  // Short names are in the label so the picker's search box matches them — it's
  // how admins refer to catalogue entries, and what the CSV columns contain.
  const testOptions = tests.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.shortName})`,
    meta: formatCurrency(t.price),
  }));

  const parameterOptions = parameters.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.shortName})`,
    meta: formatCurrency(p.price),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{pkg ? "Edit Package" : "Add Package"}</DialogTitle>
          <DialogDescription>
            {pkg
              ? "Update this bundled health package."
              : "Bundle tests and standalone parameters into a discounted package."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Package Name · Category */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pkg-name">Package Name *</Label>
              <Input
                id="pkg-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full Body Checkup - Basic"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select
                value={form.appCategoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, appCategoryId: v }))}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={appCategoriesLoading ? "Loading..." : "Select category"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {appCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                From CMS → Categories, the same tiles the patient app shows.
              </p>
            </div>
          </div>

          {/* Sample Type · Price */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Sample Type</Label>
              <Select
                value={form.sampleTypeId}
                onValueChange={(v) => setForm((f) => ({ ...f, sampleTypeId: v }))}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={sampleTypesLoading ? "Loading..." : "Select sample type"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {sampleTypes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The specimen shown on the package card. Leave empty for a mixed-specimen package —
                each member test still carries its own.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pkg-price">Price (₹) *</Label>
              <Input
                id="pkg-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="1200"
              />
            </div>
          </div>

          {/* Offer Price · Report Time */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pkg-offer-price">Offer Price (₹)</Label>
              <Input
                id="pkg-offer-price"
                type="number"
                min={0}
                value={form.offerPrice}
                onChange={(e) => setForm((f) => ({ ...f, offerPrice: e.target.value }))}
                placeholder="Optional discounted price"
                aria-invalid={offerPriceTooHigh}
              />
              {offerPriceTooHigh && (
                <p className="text-xs text-destructive">
                  Offer price can't be higher than the price.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pkg-report-time">Report Time</Label>
              <Input
                id="pkg-report-time"
                value={form.reportTime}
                onChange={(e) => setForm((f) => ({ ...f, reportTime: e.target.value }))}
                placeholder="48 Hours"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the slowest included test's own report time.
              </p>
            </div>
          </div>

          {/* Is Fasting Required · Recommended For */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Is Fasting Required</Label>
              <div className="flex items-center gap-3">
                <div className="flex h-11 flex-1 items-center justify-between rounded-lg border border-input px-3.5">
                  <span className="text-sm text-muted-foreground">
                    {form.isFastingRequired ? "Yes" : "No"}
                  </span>
                  <Switch
                    checked={form.isFastingRequired}
                    onCheckedChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        isFastingRequired: v,
                        fastingHours: v ? f.fastingHours : "",
                      }))
                    }
                  />
                </div>
                {form.isFastingRequired && (
                  <Input
                    type="number"
                    min={1}
                    max={48}
                    className="w-28"
                    value={form.fastingHours}
                    onChange={(e) => setForm((f) => ({ ...f, fastingHours: e.target.value }))}
                    placeholder="Hours"
                    aria-invalid={fastingHoursInvalid}
                  />
                )}
              </div>
              {fastingHoursInvalid && (
                <p className="text-xs text-destructive">Fasting hours must be between 1 and 48.</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Recommended For</Label>
              <Select
                value={form.recommendedFor}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, recommendedFor: v as RecommendedGender }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECOMMENDED_GENDER_OPTIONS.map((gender) => (
                    <SelectItem key={gender} value={gender}>
                      {RECOMMENDED_GENDER_LABELS[gender]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Repeat reminder after · WhatsApp template */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Repeat reminder after (days)</Label>
              <Input
                type="number"
                min={1}
                max={1095}
                value={form.followUpDays}
                onChange={(e) => setForm((f) => ({ ...f, followUpDays: e.target.value }))}
                placeholder="e.g. 90 — leave blank for no reminder"
              />
              <p className="text-xs text-muted-foreground">
                Counted from the day the report is ready. The patient gets an app notification and a
                WhatsApp reminder to book this package again.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Reminder WhatsApp template (optional)</Label>
              <Input
                className="font-mono"
                value={form.followUpTemplate}
                onChange={(e) => setForm((f) => ({ ...f, followUpTemplate: e.target.value }))}
                placeholder="test_repeat_reminder"
              />
              <p className="text-xs text-muted-foreground">
                Approved Meta template name. Blank uses test_repeat_reminder.
              </p>
            </div>
          </div>

          {/* Recommended Age */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pkg-recommended-age">Recommended Age</Label>
            <Input
              id="pkg-recommended-age"
              value={form.recommendedAge}
              onChange={(e) => setForm((f) => ({ ...f, recommendedAge: e.target.value }))}
              placeholder="18+ years"
            />
          </div>

          {/* Description (rich text) */}
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <RichTextEditor
              value={form.description}
              onChange={(html) => setForm((f) => ({ ...f, description: html }))}
              onUploadImage={uploadCmsImageApi}
              placeholder="What this package covers and who it's for…"
            />
          </div>

          {/* Sample Lab Report */}
          <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
            <Label>Sample Lab Report (optional)</Label>
            {!pkg ? (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3 shrink-0" />
                Save the package first — the file is attached to it, so there's nothing to attach to
                yet.
              </p>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={handleReportFileChange}
                />
                {pkg.sampleReportUrl ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={pkg.sampleReportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <FileText className="size-4" />
                      View current report
                    </a>
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={uploadSampleReport.isPending}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="size-3.5" />
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        disabled={removeSampleReport.isPending}
                        onClick={() =>
                          removeSampleReport.mutate(pkg.id, {
                            onSuccess: () => toast.success("Sample report removed."),
                            onError: (err) => {
                              toast.error(
                                err instanceof Error ? err.message : "Failed to remove report.",
                              );
                            },
                          })
                        }
                      >
                        <Trash2 className="size-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit gap-1.5"
                    disabled={uploadSampleReport.isPending}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-4" />
                    {uploadSampleReport.isPending ? "Uploading..." : "Upload Report"}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">PDF, PNG, JPEG or WEBP · up to 5MB.</p>
              </>
            )}
          </div>

          {/* Select Test */}
          <div className="flex flex-col gap-1.5">
            <Label>Select Test</Label>
            <MultiSelect
              options={testOptions}
              selected={form.testIds}
              onChange={(ids) => setForm((f) => ({ ...f, testIds: ids }))}
              placeholder="Search tests by name or short name"
              emptyText="No active tests found."
            />
          </div>

          {/* Select Parameter */}
          <div className="flex flex-col gap-1.5">
            <Label>Select Parameter</Label>
            <MultiSelect
              options={parameterOptions}
              selected={form.parameterIds}
              onChange={(ids) => setForm((f) => ({ ...f, parameterIds: ids }))}
              placeholder="Search bookable parameters"
              emptyText="No bookable parameters found."
            />
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3 shrink-0" />
              Only parameters with Do Test on can be added directly. To include a non-bookable
              analyte, add a test that reports it.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Sum of Members</Label>
            <div className="flex h-11 items-center rounded-lg border border-input bg-muted/40 px-3.5 text-sm font-medium tabular-nums">
              {formatCurrency(sumOfMembers)}
            </div>
          </div>

          {savingsPct !== null && (
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-sm",
                savingsPct > 0
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-warning/30 bg-warning/10 text-warning",
              )}
            >
              {savingsPct > 0
                ? `Customers save ${savingsPct}% vs booking these individually.`
                : "This package price is not cheaper than booking the members individually."}
            </div>
          )}

          {form.testIds.length === 0 && form.parameterIds.length > 0 && (
            <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
              A package needs at least one test to be bookable on the patient app — billing runs
              through member tests. Parameter-only packages save, but can't be added to a cart yet.
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Popular</p>
              <p className="text-xs text-muted-foreground">
                Featured/highlighted as a popular package on the patient app.
              </p>
            </div>
            <Switch
              checked={form.isPopular}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isPopular: v }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="package-booked-count">Booking Count</Label>
            <Input
              id="package-booked-count"
              type="number"
              min={0}
              value={form.bookedCount}
              onChange={(e) => setForm((f) => ({ ...f, bookedCount: e.target.value }))}
              placeholder="0"
              aria-invalid={bookedCountInvalid}
            />
            {bookedCountInvalid ? (
              <p className="text-xs text-destructive">Must be a whole number, 0 or more.</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                The "N people booked this" number shown on the patient app, and what its package
                list sorts by — set it directly, it isn't calculated from real orders.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="package-sort-order">Sort Order</Label>
              {pkg && <span className="text-xs text-muted-foreground">S.No: {pkg.serialNo}</span>}
            </div>
            <Input
              id="package-sort-order"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              placeholder="0"
              aria-invalid={sortOrderInvalid}
            />
            {sortOrderInvalid ? (
              <p className="text-xs text-destructive">Must be a whole number, 0 or more.</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Controls this package's position in the Superadmin list only (lower shows first) —
                doesn't affect the patient app, which sorts by Booking Count above.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive packages are hidden from the patient app.
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
            {isSaving ? "Saving..." : pkg ? "Save Changes" : "Save Package"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { PackageFormDialog };

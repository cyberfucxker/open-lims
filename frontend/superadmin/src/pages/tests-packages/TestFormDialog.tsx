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
import { useBranchUsers } from "@/hooks/queries/useBranchUsers";
import { useDepartments, useSampleTypes } from "@/hooks/queries/useMasterData";
import { useAllParameters } from "@/hooks/queries/useParameters";
import {
  useCreateTest,
  useRemoveTestSampleReport,
  useUpdateTest,
  useUploadTestSampleReport,
} from "@/hooks/queries/useTests";
import { uploadCmsImageApi } from "@/services/api/cmsPageApi";
import { RECOMMENDED_GENDER_LABELS, type RecommendedGender } from "@/services/api/parameterApi";
import type { LabTest, TestFormValues, TestStatus } from "@/services/api/testApi";

import { MultiSelect } from "./MultiSelect";
import { OrderedParameterPicker, type PickerParameter } from "./OrderedParameterPicker";

interface TestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: LabTest | null;
}

interface FormState {
  name: string;
  shortName: string;
  appCategoryId: string;
  /** The lab's internal taxonomy — optional, and independent of `appCategoryId`
   *  (the CMS tile). Only groups results on the printed report; not shown to
   *  patients. */
  departmentId: string;
  price: string;
  offerPrice: string;
  description: string;
  content: string;
  reportTime: string;
  sampleTypeId: string;
  isFastingRequired: boolean;
  fastingHours: string;
  followUpDays: string;
  followUpTemplate: string;
  recommendedFor: RecommendedGender;
  recommendedAge: string;
  /** Parameter ids in report order — array position becomes `sortOrder`. */
  parameterIds: string[];
  branchUserIds: string[];
  status: TestStatus;
  isPopular: boolean;
  /** The "N people booked this" number the patient app shows — a plain
   *  admin-set display number, not derived from real orders. */
  bookedCount: string;
  /** Manual display order for THIS Test row in the Superadmin Tests list only
   *  (ascending) — unrelated to `parameterIds`' array-order-is-sortOrder
   *  convention above, which is per-analyte within this one Test. */
  sortOrder: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  shortName: "",
  appCategoryId: "",
  departmentId: "",
  price: "",
  offerPrice: "",
  description: "",
  content: "",
  reportTime: "",
  sampleTypeId: "",
  isFastingRequired: false,
  fastingHours: "",
  followUpDays: "",
  followUpTemplate: "",
  recommendedFor: "BOTH",
  recommendedAge: "",
  parameterIds: [],
  branchUserIds: [],
  status: "Active",
  isPopular: false,
  bookedCount: "0",
  sortOrder: "0",
};

const RECOMMENDED_GENDER_OPTIONS: RecommendedGender[] = ["MALE", "FEMALE", "BOTH"];

function TestFormDialog({ open, onOpenChange, test }: TestFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: sampleTypesResult, isLoading: sampleTypesLoading } = useSampleTypes();
  const sampleTypes = (sampleTypesResult?.rows ?? []).filter((s) => s.active);

  // The CMS category tiles from CMS → Categories — the same taxonomy the
  // Parameter form uses, so a Test and a standalone analyte land on the same tile.
  const { data: appCategoriesResult, isLoading: appCategoriesLoading } = useAppCategories({
    page: 1,
    pageSize: 100,
  });
  const appCategories = (appCategoriesResult?.rows ?? []).filter((c) => c.isActive);

  // The lab's own internal taxonomy — separate from the CMS `appCategoryId`
  // tile above. Optional: the printed report groups by whichever is set,
  // falling back to the CMS category's name when it isn't.
  const { data: departmentsResult, isLoading: departmentsLoading } = useDepartments({
    page: 1,
    pageSize: 100,
  });
  const departments = (departmentsResult?.rows ?? []).filter((d) => d.active);

  const { data: branchUsers } = useBranchUsers();

  // Unfiltered on purpose: a Test may nest a non-bookable analyte — that's what
  // `doTest: false` is FOR. (The Package picker is the one that filters.)
  // `useAllParameters` pages through the whole catalogue so a test's already-
  // attached parameters always appear as selected, even past the first 500.
  const { data: allParameters } = useAllParameters({ active: "true" });
  const parameterOptions: PickerParameter[] = useMemo(
    () =>
      (allParameters ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        shortName: p.shortName,
        price: p.price,
        bookable: p.doTest,
      })),
    [allParameters],
  );

  const branchUserOptions = useMemo(
    () =>
      (branchUsers ?? []).map((u) => ({
        value: u.id,
        label: u.fullName ?? u.username,
        meta: u.organizationName ?? u.username,
      })),
    [branchUsers],
  );

  const createTest = useCreateTest();
  const updateTest = useUpdateTest();
  const uploadSampleReport = useUploadTestSampleReport();
  const removeSampleReport = useRemoveTestSampleReport();
  const isSaving = createTest.isPending || updateTest.isPending;

  useEffect(() => {
    if (!open) return;
    if (test) {
      setForm({
        name: test.name,
        shortName: test.shortName,
        appCategoryId: test.appCategoryId ?? "",
        departmentId: test.departmentId ?? "",
        price: String(test.price),
        offerPrice: test.offerPrice != null ? String(test.offerPrice) : "",
        description: test.description ?? "",
        content: test.content ?? "",
        reportTime: test.reportTime,
        sampleTypeId: test.sampleTypeId,
        isFastingRequired: test.isFastingRequired,
        fastingHours: test.fastingHours != null ? String(test.fastingHours) : "",
        followUpDays: test.followUpDays != null ? String(test.followUpDays) : "",
        followUpTemplate: test.followUpTemplate ?? "",
        recommendedFor: test.recommendedFor,
        recommendedAge: test.recommendedAge ?? "",
        // Already sorted by the API; keep that order as the form's initial one.
        parameterIds: test.parameters.map((p) => p.parameterId),
        branchUserIds: test.branchUsers.map((b) => b.userId),
        status: test.status,
        isPopular: test.isPopular,
        bookedCount: String(test.bookedCount),
        sortOrder: String(test.sortOrder),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, test]);

  const priceNum = Number(form.price);
  const offerPriceNum = form.offerPrice.trim() ? Number(form.offerPrice) : null;
  const offerPriceTooHigh = offerPriceNum !== null && priceNum > 0 && offerPriceNum > priceNum;

  const fastingHoursNum = form.fastingHours.trim() ? Number(form.fastingHours) : null;
  const fastingHoursInvalid =
    form.isFastingRequired &&
    fastingHoursNum !== null &&
    (!Number.isInteger(fastingHoursNum) || fastingHoursNum < 1 || fastingHoursNum > 48);

  const sumOfParameters = useMemo(
    () =>
      form.parameterIds.reduce(
        (sum, id) => sum + (parameterOptions.find((p) => p.id === id)?.price ?? 0),
        0,
      ),
    [form.parameterIds, parameterOptions],
  );

  const bookedCountNum = form.bookedCount.trim() ? Number(form.bookedCount) : 0;
  const bookedCountInvalid = !Number.isInteger(bookedCountNum) || bookedCountNum < 0;
  const sortOrderNum = form.sortOrder.trim() ? Number(form.sortOrder) : 0;
  const sortOrderInvalid = !Number.isInteger(sortOrderNum) || sortOrderNum < 0;

  const isValid =
    form.name.trim().length > 2 &&
    form.shortName.trim().length > 0 &&
    form.sampleTypeId.length > 0 &&
    form.reportTime.trim().length > 0 &&
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
                : "Fill all required fields before saving.",
      );
      return;
    }

    const values: TestFormValues = {
      name: form.name.trim(),
      shortName: form.shortName.trim(),
      appCategoryId: form.appCategoryId || null,
      departmentId: form.departmentId || null,
      sampleTypeId: form.sampleTypeId,
      price: priceNum,
      offerPrice: offerPriceNum,
      reportTime: form.reportTime.trim(),
      description: form.description.trim() || null,
      // Tiptap emits "<p></p>" for an emptied editor — treat that as no content.
      content: form.content.replace(/<p>\s*<\/p>/g, "").trim() || null,
      isFastingRequired: form.isFastingRequired,
      // Cleared when fasting isn't required — the server rejects hours without
      // the flag rather than quietly ignoring them.
      fastingHours: form.isFastingRequired ? fastingHoursNum : null,
      followUpDays: form.followUpDays.trim() ? Number(form.followUpDays) : null,
      followUpTemplate: form.followUpTemplate.trim() || null,
      recommendedFor: form.recommendedFor,
      recommendedAge: form.recommendedAge.trim() || null,
      status: form.status,
      isPopular: form.isPopular,
      bookedCount: bookedCountNum,
      sortOrder: sortOrderNum,
      // Always sent, including as `[]` — the form owns the full list, so an
      // explicit empty array is how "detach everything" is expressed.
      parameters: form.parameterIds.map((parameterId) => ({ parameterId })),
      branchUserIds: form.branchUserIds,
    };

    const onSettled = {
      onSuccess: () => {
        toast.success(test ? "Test updated successfully." : "Test created successfully.");
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Something went wrong.");
      },
    };

    if (test) {
      updateTest.mutate({ id: test.id, values }, onSettled);
    } else {
      createTest.mutate(values, onSettled);
    }
  }

  function handleReportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !test) return;
    uploadSampleReport.mutate(
      { id: test.id, file },
      {
        onSuccess: () => toast.success("Sample report uploaded."),
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to upload sample report.");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{test ? "Edit Test" : "Add Test"}</DialogTitle>
          <DialogDescription>
            {test
              ? "Update details for this diagnostic test."
              : "Create a diagnostic test — a named, priced panel of parameters."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Test Name · Short Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="test-name">Test Name *</Label>
              <Input
                id="test-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Complete Blood Count"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="test-short">Short Name *</Label>
              <Input
                id="test-short"
                value={form.shortName}
                onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
                placeholder="CBC"
              />
              <p className="text-xs text-muted-foreground">
                Must be unique across all tests — packages and CSV import refer to this test by it.
              </p>
            </div>
          </div>

          {/* Category · Department */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="flex flex-col gap-1.5">
              <Label>Department</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={departmentsLoading ? "Loading..." : "Select department"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The lab's internal taxonomy — groups results on the printed report. Optional.
              </p>
            </div>
          </div>

          {/* Price · Offer Price */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="test-price">Price (₹) *</Label>
              <Input
                id="test-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="350"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="test-offer-price">Offer Price (₹)</Label>
              <Input
                id="test-offer-price"
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
          </div>

          {/* Report Time */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="test-report-time">Report Time *</Label>
              <Input
                id="test-report-time"
                value={form.reportTime}
                onChange={(e) => setForm((f) => ({ ...f, reportTime: e.target.value }))}
                placeholder="24 Hours"
              />
            </div>
          </div>

          {/* Sample Type · Is Fasting Required */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Sample Type *</Label>
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
            </div>
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
                WhatsApp reminder to book this test again.
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

          {/* Test Recommended For · Recommended Age */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Test Recommended For</Label>
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="test-recommended-age">Recommended Age</Label>
              <Input
                id="test-recommended-age"
                value={form.recommendedAge}
                onChange={(e) => setForm((f) => ({ ...f, recommendedAge: e.target.value }))}
                placeholder="18+ years"
              />
            </div>
          </div>

          {/* Description (rich text) */}
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <RichTextEditor
              value={form.description}
              onChange={(html) => setForm((f) => ({ ...f, description: html }))}
              onUploadImage={uploadCmsImageApi}
              placeholder="What this test covers, why it's ordered…"
            />
            <span className="text-xs text-muted-foreground">
              Short summary — shown in the patient app.
            </span>
          </div>

          {/* Website page content (rich text) */}
          <div className="flex flex-col gap-1.5">
            <Label>Website Page Content</Label>
            <RichTextEditor
              value={form.content}
              onChange={(html) => setForm((f) => ({ ...f, content: html }))}
              onUploadImage={uploadCmsImageApi}
              placeholder="Full page content for the website test page…"
            />
            <span className="text-xs text-muted-foreground">
              Shown on the website's test page with a "Read more" fold. Write{" "}
              <code className="rounded bg-secondary px-1 font-mono">[LOCATION]</code> wherever the
              city name should appear — it is replaced with the page's city automatically.
            </span>
          </div>

          {/* Sample Lab Report */}
          <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
            <Label>Sample Lab Report (optional)</Label>
            {!test ? (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3 shrink-0" />
                Save the test first — the file is attached to it, so there's nothing to attach to
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
                {test.sampleReportUrl ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={test.sampleReportUrl}
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
                          removeSampleReport.mutate(test.id, {
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

          {/* Select Parameters */}
          <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Label>Select Parameters</Label>
              <span className="text-xs text-muted-foreground">
                {form.parameterIds.length} attached
                {sumOfParameters > 0 && ` · à la carte ${formatCurrency(sumOfParameters)}`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Drag or use the arrows to set the order they print in on the report.
            </p>
            <OrderedParameterPicker
              options={parameterOptions}
              selected={form.parameterIds}
              onChange={(ids) => setForm((f) => ({ ...f, parameterIds: ids }))}
              disabled={isSaving}
            />
          </div>

          {/* Branch User */}
          <div className="flex flex-col gap-1.5">
            <Label>Branch User</Label>
            <MultiSelect
              options={branchUserOptions}
              selected={form.branchUserIds}
              onChange={(ids) => setForm((f) => ({ ...f, branchUserIds: ids }))}
              placeholder="All branches"
              emptyText="No branch logins found."
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to make this test available at every branch. Selecting branches limits it
              to those.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Popular</p>
              <p className="text-xs text-muted-foreground">
                Featured/highlighted as a popular test on the patient app.
              </p>
            </div>
            <Switch
              checked={form.isPopular}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isPopular: v }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="test-booked-count">Booking Count</Label>
            <Input
              id="test-booked-count"
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
                The "N people booked this" number shown on the patient app — set it directly, it
                isn't calculated from real orders.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="test-sort-order">Sort Order</Label>
              {test && <span className="text-xs text-muted-foreground">S.No: {test.serialNo}</span>}
            </div>
            <Input
              id="test-sort-order"
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
                Controls this test's position in the Superadmin list only (lower shows first).
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive tests are hidden from the patient app and can't be added to packages.
              </p>
            </div>
            <Switch
              checked={form.status === "Active"}
              onCheckedChange={(v) => setForm((f) => ({ ...f, status: v ? "Active" : "Inactive" }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : test ? "Save Changes" : "Save Test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { TestFormDialog };

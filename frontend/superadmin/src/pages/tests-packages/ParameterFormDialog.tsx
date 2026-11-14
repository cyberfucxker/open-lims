import { useEffect, useRef, useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
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
import { useAppCategories } from "@/hooks/queries/useAppCategories";
import { useDepartments, useSampleTypes } from "@/hooks/queries/useMasterData";
import {
  useCreateParameter,
  useRemoveParameterSampleReport,
  useUpdateParameter,
  useUploadParameterSampleReport,
} from "@/hooks/queries/useParameters";
import { uploadCmsImageApi } from "@/services/api/cmsPageApi";
import {
  RECOMMENDED_GENDER_LABELS,
  type ParameterDto,
  type ParameterFormValues,
  type RecommendedGender,
} from "@/services/api/parameterApi";

interface ParameterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parameter: ParameterDto | null;
}

interface FormState {
  name: string;
  shortName: string;
  sampleTypeId: string;
  /** The lab's internal taxonomy — purely informational, see
   *  `ParameterDto.departmentId`'s doc-comment. */
  departmentId: string;
  appCategoryId: string;
  price: string;
  offerPrice: string;
  reportTime: string;
  isFastingRequired: boolean;
  fastingHours: string;
  followUpDays: string;
  followUpTemplate: string;
  recommendedFor: RecommendedGender;
  recommendedAge: string;
  description: string;
  doTest: boolean;
  isCommonlyUsed: boolean;
  /** Manual display order for THIS Parameter row in the Superadmin
   *  Parameters list only (ascending). */
  sortOrder: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  shortName: "",
  sampleTypeId: "",
  departmentId: "",
  appCategoryId: "",
  price: "",
  offerPrice: "",
  reportTime: "",
  isFastingRequired: false,
  fastingHours: "",
  followUpDays: "",
  followUpTemplate: "",
  recommendedFor: "BOTH",
  recommendedAge: "",
  description: "",
  doTest: false,
  isCommonlyUsed: false,
  sortOrder: "0",
  active: true,
};

const RECOMMENDED_GENDER_OPTIONS: RecommendedGender[] = ["MALE", "FEMALE", "BOTH"];

function ParameterFormDialog({ open, onOpenChange, parameter }: ParameterFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  // In Add mode there's no parameter id yet to attach an upload to, so the chosen
  // file is stashed here and uploaded right after the parameter is created.
  const [pendingReportFile, setPendingReportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: sampleTypesResult, isLoading: sampleTypesLoading } = useSampleTypes();
  const sampleTypes = (sampleTypesResult?.rows ?? []).filter((s) => s.active);

  // The CMS category tiles (Thyroid, Liver, …) from CMS → Categories, not the
  // lab's department-scoped Category list that the Test form uses.
  const { data: appCategoriesResult, isLoading: appCategoriesLoading } = useAppCategories({
    page: 1,
    pageSize: 100,
  });
  const appCategories = (appCategoriesResult?.rows ?? []).filter((c) => c.isActive);

  // The lab's own internal taxonomy — purely informational here, kept for
  // CSV import fidelity from labs that maintain it. Separate from the CMS
  // `appCategoryId` tile above.
  const { data: departmentsResult, isLoading: departmentsLoading } = useDepartments({
    page: 1,
    pageSize: 100,
  });
  const departments = (departmentsResult?.rows ?? []).filter((d) => d.active);

  const createParameter = useCreateParameter();
  const updateParameter = useUpdateParameter();
  const uploadSampleReport = useUploadParameterSampleReport();
  const removeSampleReport = useRemoveParameterSampleReport();
  const isSaving =
    createParameter.isPending || updateParameter.isPending || uploadSampleReport.isPending;

  useEffect(() => {
    if (!open) return;
    setPendingReportFile(null);
    if (parameter) {
      setForm({
        name: parameter.name,
        shortName: parameter.shortName,
        sampleTypeId: parameter.sampleTypeId ?? "",
        departmentId: parameter.departmentId ?? "",
        appCategoryId: parameter.appCategoryId ?? "",
        price: String(parameter.price),
        offerPrice: parameter.offerPrice != null ? String(parameter.offerPrice) : "",
        reportTime: parameter.reportTime ?? "",
        isFastingRequired: parameter.isFastingRequired,
        fastingHours: parameter.fastingHours != null ? String(parameter.fastingHours) : "",
        followUpDays: parameter.followUpDays != null ? String(parameter.followUpDays) : "",
        followUpTemplate: parameter.followUpTemplate ?? "",
        recommendedFor: parameter.recommendedFor,
        recommendedAge: parameter.recommendedAge ?? "",
        description: parameter.description ?? "",
        doTest: parameter.doTest,
        isCommonlyUsed: parameter.isCommonlyUsed,
        sortOrder: String(parameter.sortOrder),
        active: parameter.active,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, parameter]);

  const priceNum = Number(form.price);
  const offerPriceNum = form.offerPrice.trim() ? Number(form.offerPrice) : null;
  // Mirrors the server's own rule so the admin sees it before submitting rather
  // than as a 400 (see `catalogShortName.ts#assertOfferPriceNotAbovePrice`).
  const offerPriceTooHigh = offerPriceNum !== null && priceNum > 0 && offerPriceNum > priceNum;

  const fastingHoursNum = form.fastingHours.trim() ? Number(form.fastingHours) : null;
  const fastingHoursInvalid =
    form.isFastingRequired &&
    fastingHoursNum !== null &&
    (!Number.isInteger(fastingHoursNum) || fastingHoursNum < 1 || fastingHoursNum > 48);

  const sortOrderNum = form.sortOrder.trim() ? Number(form.sortOrder) : 0;
  const sortOrderInvalid = !Number.isInteger(sortOrderNum) || sortOrderNum < 0;

  const isValid =
    form.name.trim().length > 1 &&
    form.shortName.trim().length > 0 &&
    Number.isFinite(priceNum) &&
    priceNum >= 0 &&
    !offerPriceTooHigh &&
    !fastingHoursInvalid &&
    !sortOrderInvalid;

  function handleSubmit() {
    if (!isValid) {
      toast.error(
        offerPriceTooHigh
          ? "Offer price can't be higher than the MRP."
          : fastingHoursInvalid
            ? "Fasting hours must be between 1 and 48."
            : sortOrderInvalid
              ? "Sort order must be a whole number, 0 or more."
              : "Fill all required fields before saving.",
      );
      return;
    }

    const values: ParameterFormValues = {
      name: form.name.trim(),
      shortName: form.shortName.trim(),
      sampleTypeId: form.sampleTypeId || null,
      departmentId: form.departmentId || null,
      appCategoryId: form.appCategoryId || null,
      price: priceNum,
      offerPrice: offerPriceNum,
      reportTime: form.reportTime.trim() || null,
      isFastingRequired: form.isFastingRequired,
      // Cleared when fasting isn't required — the server rejects hours without
      // the flag rather than quietly ignoring them.
      fastingHours: form.isFastingRequired ? fastingHoursNum : null,
      followUpDays: form.followUpDays.trim() ? Number(form.followUpDays) : null,
      followUpTemplate: form.followUpTemplate.trim() || null,
      recommendedFor: form.recommendedFor,
      recommendedAge: form.recommendedAge.trim() || null,
      description: form.description.trim() || null,
      doTest: form.doTest,
      isCommonlyUsed: form.isCommonlyUsed,
      sortOrder: sortOrderNum,
      active: form.active,
    };

    if (parameter) {
      updateParameter.mutate(
        { id: parameter.id, values },
        {
          onSuccess: () => {
            toast.success("Parameter updated successfully.");
            onOpenChange(false);
          },
          onError: (error: unknown) =>
            toast.error(error instanceof Error ? error.message : "Something went wrong."),
        },
      );
      return;
    }

    createParameter.mutate(values, {
      onSuccess: (created) => {
        // Attach the stashed report (if any) now that the parameter exists.
        if (pendingReportFile) {
          uploadSampleReport.mutate(
            { id: created.id, file: pendingReportFile },
            {
              onSuccess: () => {
                toast.success("Parameter created and report uploaded.");
                onOpenChange(false);
              },
              onError: (err) => {
                // The parameter itself was created — report upload is best-effort.
                toast.error(
                  err instanceof Error
                    ? `Parameter saved, but report upload failed: ${err.message}`
                    : "Parameter saved, but the report upload failed.",
                );
                onOpenChange(false);
              },
            },
          );
          return;
        }
        toast.success("Parameter created successfully.");
        onOpenChange(false);
      },
      onError: (error: unknown) =>
        toast.error(error instanceof Error ? error.message : "Something went wrong."),
    });
  }

  function handleReportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    // Add mode: stash for upload after create. Edit mode: upload immediately.
    if (!parameter) {
      setPendingReportFile(file);
      return;
    }
    uploadSampleReport.mutate(
      { id: parameter.id, file },
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
          <DialogTitle>{parameter ? "Edit Parameter" : "Add Parameter"}</DialogTitle>
          <DialogDescription>
            {parameter
              ? "Update this analyte. Every test that reports it picks up the change."
              : "Create a reusable analyte that tests and packages can include."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Parameter Name · Sample Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="param-name">Parameter Name *</Label>
              <Input
                id="param-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Hemoglobin"
              />
            </div>
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
            </div>
          </div>

          {/* Category · Department · MRP */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                The lab's own internal taxonomy — informational only, same table Tests use.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="param-price">MRP (₹) *</Label>
              <Input
                id="param-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="120"
              />
            </div>
          </div>

          {/* Offer Price · Report Time */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="param-offer-price">Offer Price (₹)</Label>
              <Input
                id="param-offer-price"
                type="number"
                min={0}
                value={form.offerPrice}
                onChange={(e) => setForm((f) => ({ ...f, offerPrice: e.target.value }))}
                placeholder="Optional discounted price"
                aria-invalid={offerPriceTooHigh}
              />
              {offerPriceTooHigh && (
                <p className="text-xs text-destructive">
                  Offer price can't be higher than the MRP.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="param-report-time">Report Time</Label>
              <Input
                id="param-report-time"
                value={form.reportTime}
                onChange={(e) => setForm((f) => ({ ...f, reportTime: e.target.value }))}
                placeholder="Same Day"
              />
            </div>
          </div>

          {/* Is Fasting Required */}
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

          {/* Recommended For · Recommended Age */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="param-recommended-age">Recommended Age</Label>
              <Input
                id="param-recommended-age"
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
              placeholder="What this parameter measures, why it's ordered…"
            />
          </div>

          {/* Sample Lab Report Upload — available in both Add and Edit modes.
              In Add mode the chosen file is uploaded right after the parameter
              is created (see handleSubmit). */}
          <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
            <Label>Sample Lab Report (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={handleReportFileChange}
            />
            {!parameter ? (
              // ADD MODE — stash the file, attach it on save.
              pendingReportFile ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <FileText className="size-4" />
                    {pendingReportFile.name}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
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
                      onClick={() => setPendingReportFile(null)}
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
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-4" />
                  Upload Report
                </Button>
              )
            ) : parameter.sampleReportUrl ? (
              // EDIT MODE — a report already exists.
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={parameter.sampleReportUrl}
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
                      removeSampleReport.mutate(parameter.id, {
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
              // EDIT MODE — no report yet.
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
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div className="pr-4">
              <p className="text-sm font-medium text-foreground">Do Test</p>
              <p className="text-xs text-muted-foreground">
                On: patients can book this analyte on its own, and it can be added straight to a
                package. Off: it only ever appears inside a test.
              </p>
            </div>
            <Switch
              checked={form.doTest}
              onCheckedChange={(v) =>
                setForm((f) => ({
                  ...f,
                  doTest: v,
                  // Commonly Used only means anything alongside Do Test —
                  // turning this off clears it too, same as Fasting Hours
                  // clearing when Is Fasting Required goes off, rather than
                  // letting Save fail on the server's own consistency check.
                  isCommonlyUsed: v ? f.isCommonlyUsed : false,
                }))
              }
            />
          </div>

          {form.doTest && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
              <div className="pr-4">
                <p className="text-sm font-medium text-foreground">Commonly Used</p>
                <p className="text-xs text-muted-foreground">
                  Shows this analyte's own bookable listing in the patient app's Tests browse.
                  Hundreds of Parameters are individually bookable (Do Test) but stay out of that
                  list unless flagged here — keep this on for maybe 40–50 analytes people actually
                  search for by name.
                </p>
              </div>
              <Switch
                checked={form.isCommonlyUsed}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isCommonlyUsed: v }))}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="parameter-sort-order">Sort Order</Label>
              {parameter && (
                <span className="text-xs text-muted-foreground">S.No: {parameter.serialNo}</span>
              )}
            </div>
            <Input
              id="parameter-sort-order"
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
                Controls this parameter's position in the Superadmin list only (lower shows first).
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div className="pr-4">
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive parameters can't be added to new tests or packages. Existing ones keep
                reporting.
              </p>
            </div>
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
            />
          </div>

          {parameter && parameter.testCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Reported by {parameter.testCount} test{parameter.testCount === 1 ? "" : "s"}. Renaming
              it here updates all of them.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : parameter ? "Save Changes" : "Save Parameter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ParameterFormDialog };

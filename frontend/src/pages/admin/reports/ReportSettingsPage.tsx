import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, RotateCcw, Save, Undo2 } from "lucide-react";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { RippleButton } from "@/components/common/RippleButton";
import { ReportAssetUploadField } from "@/components/reports/ReportAssetUploadField";
import { ReportDesignerPreview } from "@/components/reports/ReportDesignerPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useReportSettings,
  useRestoreDefaultReportSettings,
  useUpdateReportSettings,
} from "@/hooks/queries/useReportSettings";
import {
  reportSettingsFormSchema,
  type ReportSettingsFormSchemaType,
} from "@/schemas/reportSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { ReportSettings } from "@/types/report";

const DEFAULT_VALUES: ReportSettingsFormSchemaType = {
  labName: "",
  primaryColor: "#0B1E39",
  headerText: "",
  footerText: "",
  showFooter: true,
  watermarkMode: "NONE",
  watermarkText: "",
  showSignature: true,
  minSignaturesRequired: 1,
  showBarcode: true,
  showQrCode: true,
  barcodePosition: "TOP_RIGHT",
  showPageNumber: true,
  marginTop: 40,
  marginRight: 40,
  marginBottom: 40,
  marginLeft: 40,
  lineSpacing: 1,
  fontSize: 9,
  pageSize: "A4",
  patientFields: {
    patientId: true,
    ageGender: true,
    mobile: false,
    billNo: true,
    reportDate: true,
    approvedDate: true,
    emergency: true,
    status: true,
  },
  reportFields: {
    unit: true,
    referenceRange: true,
    method: true,
    remarks: true,
    flag: true,
  },
};

function valuesFromSettings(settings: ReportSettings): ReportSettingsFormSchemaType {
  return {
    labName: settings.labName ?? "",
    primaryColor: settings.primaryColor,
    headerText: settings.headerText ?? "",
    footerText: settings.footerText ?? "",
    showFooter: settings.showFooter,
    watermarkMode: settings.watermarkMode,
    watermarkText: settings.watermarkText ?? "",
    showSignature: settings.showSignature,
    minSignaturesRequired: settings.minSignaturesRequired,
    showBarcode: settings.showBarcode,
    showQrCode: settings.showQrCode,
    barcodePosition: settings.barcodePosition,
    showPageNumber: settings.showPageNumber,
    marginTop: settings.marginTop,
    marginRight: settings.marginRight,
    marginBottom: settings.marginBottom,
    marginLeft: settings.marginLeft,
    lineSpacing: settings.lineSpacing,
    fontSize: settings.fontSize,
    pageSize: settings.pageSize === "LETTER" ? "LETTER" : "A4",
    patientFields: settings.patientFields,
    reportFields: settings.reportFields,
  };
}

const PATIENT_FIELD_LABELS: {
  key: keyof ReportSettingsFormSchemaType["patientFields"];
  label: string;
}[] = [
  { key: "patientId", label: "Patient ID" },
  { key: "ageGender", label: "Age / Gender" },
  { key: "mobile", label: "Mobile" },
  { key: "billNo", label: "Bill No" },
  { key: "reportDate", label: "Report Date" },
  { key: "approvedDate", label: "Approved Date" },
  { key: "emergency", label: "Emergency Flag" },
  { key: "status", label: "Status" },
];

const REPORT_FIELD_LABELS: {
  key: keyof ReportSettingsFormSchemaType["reportFields"];
  label: string;
}[] = [
  { key: "unit", label: "Unit" },
  { key: "referenceRange", label: "Reference Range" },
  { key: "method", label: "Method" },
  { key: "remarks", label: "Remarks" },
  { key: "flag", label: "Abnormal Flag (H/L/HH/LL)" },
];

function ReportSettingsPage() {
  const { data: settings, isLoading } = useReportSettings();
  const updateSettings = useUpdateReportSettings();
  const restoreDefaults = useRestoreDefaultReportSettings();

  const form = useForm<ReportSettingsFormSchemaType>({
    resolver: zodResolver(reportSettingsFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (settings) form.reset(valuesFromSettings(settings));
  }, [settings, form]);

  const watermarkMode = form.watch("watermarkMode");
  const values = form.watch();

  const onSubmit = form.handleSubmit(async (formValues) => {
    try {
      await updateSettings.mutateAsync(formValues);
      toast.success("Report settings saved");
    } catch (error) {
      toast.error(
        error instanceof ApiRequestError ? error.message : "Failed to save report settings",
      );
    }
  });

  const handleReset = () => {
    if (settings) form.reset(valuesFromSettings(settings));
    toast.success("Unsaved changes discarded");
  };

  const handleRestoreDefault = async () => {
    try {
      await restoreDefaults.mutateAsync();
      toast.success("Report settings restored to defaults");
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to restore defaults");
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Report Designer"
        description="Customize the letterhead, branding, layout and visible fields — changes preview instantly on the right."
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={updateSettings.isPending}
            >
              <Undo2 className="size-4" /> Reset
            </Button>
            <ConfirmDialog
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                >
                  <RotateCcw className="size-4" /> Restore Default
                </Button>
              }
              title="Restore default report settings?"
              description="Every branding/layout/field customization will be reset to the factory defaults. This cannot be undone."
              confirmLabel="Restore Default"
              destructive
              onConfirm={handleRestoreDefault}
            />
            <RippleButton onClick={onSubmit} disabled={updateSettings.isPending}>
              <Save className="size-4" /> {updateSettings.isPending ? "Saving…" : "Save"}
            </RippleButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_480px]">
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <Card>
              <CardContent className="pt-5">
                <Tabs defaultValue="branding">
                  <TabsList>
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                    <TabsTrigger value="layout">Layout</TabsTrigger>
                    <TabsTrigger value="fields">Fields</TabsTrigger>
                  </TabsList>

                  <TabsContent value="branding" className="flex flex-col gap-4 pt-4">
                    <ReportAssetUploadField
                      label="Logo"
                      assetType="logo"
                      path={settings.logoPath}
                    />
                    <ReportAssetUploadField
                      label="Header Image"
                      assetType="header"
                      path={settings.headerImagePath}
                    />
                    <ReportAssetUploadField
                      label="Footer Image"
                      assetType="footer"
                      path={settings.footerImagePath}
                    />
                    <ReportAssetUploadField
                      label="Signature"
                      assetType="signature"
                      path={settings.signaturePath}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="labName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lab Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Example Diagnostics Lab" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Color</FormLabel>
                            <FormControl>
                              <input
                                type="color"
                                className="h-9 w-full cursor-pointer rounded-md border border-input"
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="headerText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Header Text (used when no header image)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Address, phone, email…" rows={2} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-[1fr_auto] gap-3">
                      <FormField
                        control={form.control}
                        name="footerText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Footer Text (used when no footer image)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g. This is a computer-generated report."
                                rows={2}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="showFooter"
                        render={({ field }) => (
                          <FormItem className="flex flex-col items-center justify-end gap-1.5 pb-1">
                            <FormLabel className="cursor-pointer text-xs">Show Footer</FormLabel>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
                      <FormField
                        control={form.control}
                        name="watermarkMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Watermark</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(v) => v && field.onChange(v)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="NONE">None</SelectItem>
                                <SelectItem value="TEXT">Text</SelectItem>
                                <SelectItem value="IMAGE">Image</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      {watermarkMode === "TEXT" && (
                        <FormField
                          control={form.control}
                          name="watermarkText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Watermark Text</FormLabel>
                              <FormControl>
                                <Input placeholder="CONFIDENTIAL" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                      {watermarkMode === "IMAGE" && (
                        <div className="flex items-end">
                          <ReportAssetUploadField
                            label="Watermark Image"
                            assetType="watermark"
                            path={settings.watermarkImagePath}
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="layout" className="flex flex-col gap-4 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="pageSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Page Size</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(v) => v && field.onChange(v)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="A4">A4</SelectItem>
                                <SelectItem value="LETTER">Letter</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fontSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Font Size</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={6}
                                max={18}
                                {...field}
                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="lineSpacing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Row Spacing ({Number(field.value).toFixed(2)}×)</FormLabel>
                          <FormControl>
                            <input
                              type="range"
                              min={0.8}
                              max={2.5}
                              step={0.1}
                              className="w-full"
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div>
                      <p className="mb-2 text-sm font-medium">Margins (pt)</p>
                      <div className="grid grid-cols-4 gap-2">
                        <FormField
                          control={form.control}
                          name="marginTop"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Top</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  max={200}
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="marginRight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Right</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  max={200}
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="marginBottom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Bottom</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  max={200}
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="marginLeft"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Left</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  max={200}
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="barcodePosition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Barcode Position</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(v) => v && field.onChange(v)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="TOP_LEFT">Top Left</SelectItem>
                                <SelectItem value="TOP_RIGHT">Top Right</SelectItem>
                                <SelectItem value="BOTTOM_LEFT">Bottom Left</SelectItem>
                                <SelectItem value="BOTTOM_RIGHT">Bottom Right</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <div className="flex flex-col justify-end gap-2 pb-1">
                        <FormField
                          control={form.control}
                          name="showBarcode"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <FormLabel className="cursor-pointer text-xs">Show Barcode</FormLabel>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="showQrCode"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <FormLabel className="cursor-pointer text-xs">Show QR Code</FormLabel>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="showPageNumber"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border px-3.5 py-2.5">
                            <FormLabel className="cursor-pointer">Show Page Number</FormLabel>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="showSignature"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border px-3.5 py-2.5">
                            <FormLabel className="cursor-pointer">Show Signature</FormLabel>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="minSignaturesRequired"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border px-3.5 py-2.5">
                            <FormLabel className="cursor-pointer">Signatures Required</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={5}
                                className="h-8 w-16"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="fields" className="grid grid-cols-2 gap-6 pt-4">
                    <div>
                      <p className="mb-2 text-sm font-medium">Patient Fields</p>
                      <div className="flex flex-col gap-1">
                        {PATIENT_FIELD_LABELS.map(({ key, label }) => (
                          <FormField
                            key={key}
                            control={form.control}
                            name={`patientFields.${key}`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg px-2 py-1.5 hover:bg-secondary/40">
                                <FormLabel className="cursor-pointer font-normal">
                                  {label}
                                </FormLabel>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">Report Columns</p>
                      <div className="flex flex-col gap-1">
                        {REPORT_FIELD_LABELS.map(({ key, label }) => (
                          <FormField
                            key={key}
                            control={form.control}
                            name={`reportFields.${key}`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg px-2 py-1.5 hover:bg-secondary/40">
                                <FormLabel className="cursor-pointer font-normal">
                                  {label}
                                </FormLabel>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </form>
        </Form>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <ReportDesignerPreview values={values} />
        </div>
      </div>
    </div>
  );
}

export { ReportSettingsPage };

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import { CalendarClock, UserRound } from "lucide-react";

import { SearchableSelect } from "@/components/common/SearchableSelect";
import { DobInput } from "@/components/patients/DobInput";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useActiveCenters } from "@/hooks/queries/useCenters";
import { useRovingTabIndex } from "@/hooks/useRovingTabIndex";
import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { PatientFormSchema } from "@/schemas/patientSchema";
import { advanceOnEnter, focusNextFromActiveElement } from "@/utils/keyboardNav";
import { computeAge } from "@/utils/age";
import { cn } from "@/utils/cn";
import {
  COMPACT_INPUT,
  COMPACT_LABEL,
  COMPACT_TRIGGER,
} from "@/components/patients/registrationCompactStyles";

interface ActiveReferralDoctorOption {
  id: string;
  doctorName: string;
  hospitalName: string | null;
  speciality: string | null;
}

/** Active referral doctors for the "Referring Doctor" picker below — kept as
 *  a local query (rather than importing the Marketing Staff module's own
 *  hook) since this form only ever needs the flat active list, never the
 *  paginated/admin view. */
function useActiveReferralDoctorOptions() {
  return useQuery({
    queryKey: ["referralDoctors", "active"],
    queryFn: async () => {
      const response = await httpClient.get<ApiResponseBody<ActiveReferralDoctorOption[]>>(
        "/referral-doctors/active",
      );
      return response.data.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

interface ActiveReferralSourceOption {
  id: string;
  name: string;
  referralType: string;
  speciality: string | null;
  city: string | null;
}

/** Active referral sources for the "Referral Source" picker below — from the
 *  fully separate Referral Management module (distinct from "Referring
 *  Doctor" above, which belongs to the Marketing Staff module). Same local
 *  inline-query convention as `useActiveReferralDoctorOptions`. */
function useActiveReferralSourceOptions() {
  return useQuery({
    queryKey: ["referralSources", "active"],
    queryFn: async () => {
      const response = await httpClient.get<ApiResponseBody<ActiveReferralSourceOption[]>>(
        "/referral-sources/active",
      );
      return response.data.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

const TITLES = ["Mr.", "Mrs.", "Ms.", "Baby", "Dr."];
const GENDERS = ["Male", "Female", "Other"] as const;
const PATIENT_TYPES = ["Retail", "B2B"] as const;

const COLLECTION_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatCollectionDate(date: Date): string {
  // en-GB renders "28/07/2026, 13:20" — swap slashes for hyphens to match this
  // app's DD-MM-YYYY date style used elsewhere.
  return COLLECTION_DATE_FORMATTER.format(date).replace(/\//g, "-");
}

/** Read-only "now" display — the actual collection timestamp is always the
 *  server's `createdAt` on save, this is just a live clock for staff
 *  reference while filling the form, isolated in its own component so its
 *  30s tick doesn't re-render the rest of the (much larger) form. */
function CollectionDateDisplay() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-1 @2xl:col-span-2">
      <span className={COMPACT_LABEL}>Collection Date</span>
      <div className="flex h-9 items-center gap-1.5 rounded-[6px] border border-input bg-secondary/40 px-2.5 text-sm font-bold whitespace-nowrap text-muted-foreground">
        <CalendarClock className="size-3.5 shrink-0" />
        {formatCollectionDate(now)}
      </div>
    </div>
  );
}

interface IdentityFieldsGridProps {
  form: UseFormReturn<PatientFormSchema>;
}

function IdentityFieldsGrid({ form }: IdentityFieldsGridProps) {
  const { data: referralDoctors } = useActiveReferralDoctorOptions();
  const referralDoctorOptions = useMemo(
    () =>
      (referralDoctors ?? []).map((doctor) => ({
        value: doctor.id,
        label: doctor.doctorName,
        description: doctor.hospitalName ?? doctor.speciality ?? undefined,
      })),
    [referralDoctors],
  );
  const { data: referralSources } = useActiveReferralSourceOptions();
  const referralSourceOptions = useMemo(
    () =>
      (referralSources ?? []).map((source) => ({
        value: source.id,
        label: source.name,
        description: source.speciality ?? source.city ?? undefined,
      })),
    [referralSources],
  );
  const { data: centersData } = useActiveCenters();
  const centerOptions = useMemo(() => centersData ?? [], [centersData]);
  const dob = form.watch("dob");
  const gender = form.watch("gender");
  const age = useMemo(() => computeAge(dob), [dob]);
  const genderIndex = Math.max(0, GENDERS.indexOf(gender as (typeof GENDERS)[number]));
  const { getItemProps } = useRovingTabIndex(GENDERS.length, genderIndex, (index) =>
    form.setValue("gender", GENDERS[index], { shouldValidate: true }),
  );

  return (
    <Card className="shrink-0 py-2.5">
      <CardHeader className="flex-row items-center gap-2 space-y-0 px-3 pb-1.5">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-primary/15 text-primary">
          <UserRound className="size-3.5" />
        </div>
        <h3 className="text-sm font-bold text-navy-950">Patient Details</h3>
      </CardHeader>
      <CardContent className="@container flex flex-col gap-2 px-3 pt-0.5">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 @sm:grid-cols-3 @lg:grid-cols-4 @2xl:grid-cols-11">
          <FormField
            control={form.control}
            name="patientType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={COMPACT_LABEL}>Patient Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className={COMPACT_TRIGGER}>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PATIENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
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
            name="optionalPatientId"
            render={({ field }) => (
              <FormItem className="@2xl:col-span-2">
                <FormLabel className={COMPACT_LABEL}>Optional Patient ID</FormLabel>
                <FormControl>
                  <Input
                    id="optional-patient-id-input"
                    placeholder="External ID"
                    className={COMPACT_INPUT}
                    tabIndex={-1}
                    onKeyDown={advanceOnEnter}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={COMPACT_LABEL}>Designation</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    setTimeout(focusNextFromActiveElement, 0);
                  }}
                >
                  <FormControl>
                    <SelectTrigger id="registration-title-trigger" className={COMPACT_TRIGGER}>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TITLES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
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
            name="fullName"
            render={({ field }) => (
              <FormItem className="@sm:col-span-2">
                <FormLabel className={COMPACT_LABEL}>Full Name</FormLabel>
                <FormControl>
                  <Input
                    id="registration-fullname-input"
                    placeholder="Aarav Sharma"
                    className={COMPACT_INPUT}
                    onKeyDown={advanceOnEnter}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={COMPACT_LABEL}>Age</FormLabel>
                <div className="flex items-center gap-1.5">
                  <DobInput
                    id="registration-dob-input"
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? "")}
                    onKeyDown={advanceOnEnter}
                    invalid={!!form.formState.errors.dob}
                    className={COMPACT_TRIGGER}
                  />
                  {age && (
                    <span className="shrink-0 rounded-[6px] bg-secondary/60 px-2 py-1.5 text-xs font-bold whitespace-nowrap text-muted-foreground">
                      {age.years}y {age.months}m
                    </span>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={() => (
              <FormItem className="@2xl:col-span-4">
                <FormLabel className={COMPACT_LABEL}>Gender</FormLabel>
                <div
                  role="radiogroup"
                  aria-label="Gender"
                  className="flex h-9 flex-wrap items-center gap-1.5"
                >
                  {GENDERS.map((g, index) => (
                    <button
                      key={g}
                      type="button"
                      role="radio"
                      aria-checked={gender === g}
                      onClick={() => form.setValue("gender", g, { shouldValidate: true })}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-sm font-bold transition-colors",
                        gender === g
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                      {...getItemProps(index)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-1 @2xl:col-span-2">
            <span className={cn(COMPACT_LABEL, "text-foreground")}>Collection Center</span>
            <div className="flex items-center gap-1.5">
              <FormField
                control={form.control}
                name="centerId"
                render={({ field }) => (
                  <FormItem className="min-w-0 flex-1 space-y-0">
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className={COMPACT_TRIGGER}>
                          <SelectValue placeholder="Select center" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {centerOptions.map((c) => (
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
                name="homeCollection"
                render={({ field }) => (
                  <FormItem className="flex shrink-0 flex-row items-center gap-1.5 space-y-0 rounded-[6px] border border-input px-2 py-1.5">
                    <FormLabel className="cursor-pointer text-xs font-bold whitespace-nowrap">
                      Home
                    </FormLabel>
                    <Switch checked={field.value} onCheckedChange={field.onChange} tabIndex={-1} />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <CollectionDateDisplay />

          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem className="@2xl:col-span-2">
                <FormLabel className={COMPACT_LABEL}>Mobile Number</FormLabel>
                <FormControl>
                  <div className="flex h-9 items-center rounded-[6px] border border-input shadow-sm has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-primary/15">
                    <span className="border-r border-input px-2.5 text-sm font-bold text-muted-foreground select-none">
                      +91
                    </span>
                    <Input
                      placeholder="98765 43210"
                      maxLength={10}
                      tabIndex={-1}
                      className="h-9 rounded-l-none border-0 text-sm font-bold shadow-none placeholder:text-xs placeholder:font-normal focus-visible:ring-0"
                      onKeyDown={advanceOnEnter}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={COMPACT_LABEL}>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="patient@example.com"
                    className={COMPACT_INPUT}
                    tabIndex={-1}
                    onKeyDown={advanceOnEnter}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="@sm:col-span-2 @2xl:col-span-1">
                <FormLabel className={COMPACT_LABEL}>Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="House no., street, area"
                    className={COMPACT_INPUT}
                    tabIndex={-1}
                    onKeyDown={advanceOnEnter}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="organization"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={COMPACT_LABEL}>Organization</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Optional"
                    className={COMPACT_INPUT}
                    tabIndex={-1}
                    onKeyDown={advanceOnEnter}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="referralDoctorId"
            render={({ field }) => (
              <FormItem className="@2xl:col-span-2">
                <FormLabel className={COMPACT_LABEL}>Referring Doctor</FormLabel>
                <SearchableSelect
                  options={referralDoctorOptions}
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    setTimeout(focusNextFromActiveElement, 0);
                  }}
                  placeholder="Optional"
                  className={COMPACT_TRIGGER}
                  tabIndex={-1}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="referralSourceId"
            render={({ field }) => (
              <FormItem className="@sm:col-span-2 @2xl:col-span-4">
                <FormLabel className={COMPACT_LABEL}>Referral Source</FormLabel>
                <SearchableSelect
                  options={referralSourceOptions}
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    setTimeout(focusNextFromActiveElement, 0);
                  }}
                  placeholder="Optional"
                  className={COMPACT_TRIGGER}
                  tabIndex={-1}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export { IdentityFieldsGrid };

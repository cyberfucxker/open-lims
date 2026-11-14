import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { SuccessAnimation } from "@/components/common/SuccessAnimation";
import { BillingSummaryPanel } from "@/components/patients/BillingSummaryPanel";
import { IdentityFieldsGrid } from "@/components/patients/IdentityFieldsGrid";
import { SelectedTestsPanel } from "@/components/patients/SelectedTestsPanel";
import { TestSelectionPanel } from "@/components/patients/TestSelectionPanel";
import { Form } from "@/components/ui/form";
import { useCreatePatient } from "@/hooks/queries/usePatients";
import { useTests } from "@/hooks/queries/useTests";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { patientFormSchema, type PatientFormSchema } from "@/schemas/patientSchema";
import type { PaymentMode } from "@/types/patient";
import type { LabTest } from "@/types/test";
import { focusInputWithin } from "@/utils/keyboardNav";

// With ~4000 tests in the catalog, the full list is never loaded into the
// browser — only a couple show before the user searches, and typing hits
// the API (debounced) for matches, same as `/tests` search elsewhere.
const DEFAULT_TEST_PAGE_SIZE = 2;
const SEARCH_TEST_PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 300;

const DEFAULT_VALUES: PatientFormSchema = {
  optionalPatientId: "",
  title: "Mr.",
  fullName: "",
  gender: "Male",
  patientType: "Retail",
  dob: "",
  mobile: "",
  email: "",
  address: "",
  centerId: "",
  homeCollection: false,
  organization: "",
  referralDoctorId: "",
  referralSourceId: "",
  whatsappOptIn: true,
  smsOptIn: false,
  emailOptIn: false,
  discountPercent: 0,
  paymentMode: "Cash",
  amountPaid: 0,
};

function PatientRegistrationPage() {
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const createPatient = useCreatePatient();

  const [testSearch, setTestSearch] = useState("");
  const [debouncedTestSearch, setDebouncedTestSearch] = useState("");
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedTestSearch(testSearch), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [testSearch]);

  const { data: testsData, isLoading: isLoadingTests } = useTests({
    status: "Active",
    search: debouncedTestSearch || undefined,
    pageSize: debouncedTestSearch ? SEARCH_TEST_PAGE_SIZE : DEFAULT_TEST_PAGE_SIZE,
  });
  const searchResults = useMemo(() => testsData?.rows ?? [], [testsData]);

  // Every test ever returned by a search, keyed by id — so a selected test
  // stays resolvable (name/price for the Selected Test List and billing)
  // even after the search term moves on and it's no longer in `searchResults`.
  const [knownTestsById, setKnownTestsById] = useState<Record<string, LabTest>>({});
  useEffect(() => {
    if (searchResults.length === 0) return;
    setKnownTestsById((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const test of searchResults) {
        if (next[test.id] !== test) {
          next[test.id] = test;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [searchResults]);
  const knownTests = useMemo(() => Object.values(knownTestsById), [knownTestsById]);

  const form = useForm<PatientFormSchema>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const discountPercent = form.watch("discountPercent") || 0;
  const paymentMode = form.watch("paymentMode");

  const { subtotal, discount, total } = useMemo(() => {
    const selectedTests = knownTests.filter((t) => selectedTestIds.includes(t.id));
    const sub = selectedTests.reduce((sum, t) => sum + t.price, 0);
    const disc = Math.round((sub * discountPercent) / 100);
    return { subtotal: sub, discount: disc, total: sub - disc };
  }, [knownTests, selectedTestIds, discountPercent]);

  const resetAll = () => {
    form.reset(DEFAULT_VALUES);
    setSelectedTestIds([]);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (selectedTestIds.length === 0) {
      toast.error("Select at least one test to continue");
      return;
    }
    try {
      const patient = await createPatient.mutateAsync({ values, testIds: selectedTestIds });
      setShowSuccess(true);
      toast.success(`${patient.fullName} registered successfully — ${patient.patientId}`);
      window.setTimeout(() => {
        setShowSuccess(false);
        resetAll();
      }, 1400);
    } catch (error) {
      toast.error(
        error instanceof ApiRequestError ? error.message : "Registration failed. Please try again.",
      );
    }
  });

  // Auto-focus the first field on mount.
  useEffect(() => {
    window.setTimeout(() => document.getElementById("registration-title-trigger")?.focus(), 0);
  }, []);

  // Global keyboard shortcuts: Ctrl/Cmd+Enter save, Alt+A add test.
  // Also enforces the strict keyboard-only tab sequence for patient
  // registration: Designation -> ... -> Save & Finish, wrapping at both ends
  // instead of leaking Tab/Shift+Tab into the surrounding layout (sidebar, topbar).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "Enter") {
        e.preventDefault();
        void onSubmit();
      } else if (e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        focusInputWithin("#test-search-wrapper");
      } else if (e.key === "Tab") {
        const active = document.activeElement;
        if (!e.shiftKey && active?.id === "registration-save-finish-button") {
          e.preventDefault();
          document.getElementById("registration-title-trigger")?.focus();
        } else if (e.shiftKey && active?.id === "registration-title-trigger") {
          e.preventDefault();
          document.getElementById("registration-save-finish-button")?.focus();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSubmit]);

  return (
    <div className="relative flex flex-col gap-2 lg:h-[calc(100svh-8rem)] lg:gap-2 lg:overflow-hidden">
      <SuccessAnimation
        open={showSuccess}
        title="Saved!"
        description="The patient record has been created successfully."
      />

      <Form {...form}>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col gap-2 lg:gap-3">
          <IdentityFieldsGrid form={form} />

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-[0.6fr_0.6fr_500px] lg:gap-3">
            <TestSelectionPanel
              tests={searchResults}
              isLoading={isLoadingTests}
              search={testSearch}
              onSearchChange={setTestSearch}
              selectedTestIds={selectedTestIds}
              onChange={setSelectedTestIds}
            />
            <SelectedTestsPanel
              tests={knownTests}
              selectedTestIds={selectedTestIds}
              onChange={setSelectedTestIds}
              subtotal={subtotal}
            />
            <BillingSummaryPanel
              control={form.control}
              paymentMode={paymentMode as PaymentMode}
              onPaymentModeChange={(next) =>
                form.setValue("paymentMode", next, { shouldValidate: true })
              }
              subtotal={subtotal}
              discount={discount}
              total={total}
              submitLabel="Save & Finish"
              isSubmitting={createPatient.isPending}
              onReset={resetAll}
            />
          </div>
        </form>
      </Form>
    </div>
  );
}

export { PatientRegistrationPage };

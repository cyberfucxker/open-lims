import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { CreditCard, FlaskConical, Search, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { FormSection } from "@/components/common/FormSection";
import { PageHeader } from "@/components/common/PageHeader";
import { RippleButton } from "@/components/common/RippleButton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useTests } from "@/hooks/queries/useTests";
import { useRegisterPatientRecord } from "@/hooks/queries/usePatientRecords";
import {
  portalPatientFormSchema,
  type PortalPatientFormSchemaType,
} from "@/schemas/portalPatientSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";

const DEFAULT_VALUES: PortalPatientFormSchemaType = {
  title: "Mr",
  fullName: "",
  gender: "Male",
  dob: "",
  mobile: "",
  email: "",
  whatsappOptIn: false,
  smsOptIn: false,
  emailOptIn: false,
  testIds: [],
  discountPercent: 0,
  paymentMode: "Cash",
  amountPaid: 0,
  isEmergency: false,
};

function PortalPatientRegistrationPage() {
  const navigate = useNavigate();
  const [testSearch, setTestSearch] = useState("");
  const { data: testsData } = useTests({ status: "Active", pageSize: 100 });
  const registerPatient = useRegisterPatientRecord();

  const form = useForm<PortalPatientFormSchemaType>({
    resolver: zodResolver(portalPatientFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const selectedTestIds = form.watch("testIds");
  const filteredTests = useMemo(
    () =>
      testsData?.rows.filter((test) =>
        test.name.toLowerCase().includes(testSearch.toLowerCase()),
      ) ?? [],
    [testsData, testSearch],
  );

  const subtotal = useMemo(
    () =>
      testsData?.rows
        .filter((test) => selectedTestIds.includes(test.id))
        .reduce((sum, test) => sum + test.price, 0) ?? 0,
    [testsData, selectedTestIds],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await registerPatient.mutateAsync(values);
      toast.success(`${values.fullName} registered — ${result.patient.patientId}`);
      navigate("/portal/patients");
    } catch (error) {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Patient Registration"
        description="Register a new patient and book their first visit."
      />

      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <FormSection
            title="Patient Details"
            description="Basic information"
            icon={UserPlus}
            index={0}
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["Mr", "Mrs", "Ms", "Master", "Dr"].map((title) => (
                        <SelectItem key={title} value={title}>
                          {title}
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
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Patient name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isEmergency"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border px-3.5 py-2.5 sm:col-span-2">
                  <FormLabel className="cursor-pointer">Emergency / STAT</FormLabel>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection
            title="Select Tests"
            description="Choose the tests to book for this visit"
            icon={FlaskConical}
            index={1}
          >
            <div className="relative sm:col-span-2">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tests…"
                className="pl-9"
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
              />
            </div>
            <FormField
              control={form.control}
              name="testIds"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <div className="flex max-h-64 flex-col divide-y divide-border overflow-y-auto rounded-lg border border-border">
                    {filteredTests.map((test) => (
                      <label
                        key={test.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Checkbox
                            checked={field.value.includes(test.id)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, test.id]
                                  : field.value.filter((id) => id !== test.id),
                              )
                            }
                          />
                          {test.name}
                        </span>
                        <span className="text-muted-foreground">₹{test.price}</span>
                      </label>
                    ))}
                    {filteredTests.length === 0 && (
                      <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No tests found.
                      </p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3.5 py-2.5 text-sm sm:col-span-2">
              <span className="text-muted-foreground">
                Subtotal ({selectedTestIds.length} tests)
              </span>
              <span className="font-semibold text-foreground">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>
          </FormSection>

          <FormSection
            title="Payment"
            description="Discount and payment details"
            icon={CreditCard}
            index={2}
          >
            <FormField
              control={form.control}
              name="discountPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Mode</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="Credit">Credit</SelectItem>
                      <SelectItem value="Insurance">Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amountPaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Paid (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          <div className="flex justify-end gap-2.5">
            <RippleButton type="submit" disabled={registerPatient.isPending}>
              {registerPatient.isPending ? "Registering…" : "Register Patient"}
            </RippleButton>
          </div>
        </form>
      </Form>
    </div>
  );
}

export { PortalPatientRegistrationPage };

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Building2, CreditCard, KeyRound, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { FormSection } from "@/components/common/FormSection";
import { PageHeader } from "@/components/common/PageHeader";
import { RippleButton } from "@/components/common/RippleButton";
import { OrganizationLoginPanel } from "@/components/organizations/OrganizationLoginPanel";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateOrganization,
  useOrganization,
  useUpdateOrganization,
} from "@/hooks/queries/useOrganizations";
import { usePriceLists } from "@/hooks/queries/usePriceLists";
import {
  organizationFormSchema,
  type OrganizationFormSchemaType,
} from "@/schemas/organizationSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { DeliveryChannel } from "@/types/organization";

const DEFAULT_VALUES: OrganizationFormSchemaType = {
  name: "",
  type: "GENERAL_CENTER",
  contactPerson: "",
  mobile: "",
  email: "",
  country: "",
  state: "",
  city: "",
  pincode: "",
  address: "",
  description: "",
  priceListId: "",
  paymentType: "PREPAID",
  creditLimit: 0,
  advanceAmount: 0,
  dueDays: 0,
  source: "",
  billingRules: "",
  invoiceRules: "",
  reportDeliveryChannels: [],
  billDeliveryChannels: [],
  active: true,
};

const CHANNEL_OPTIONS: { value: DeliveryChannel; label: string }[] = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
];

function ChannelCheckboxes({
  value,
  onChange,
}: {
  value: DeliveryChannel[];
  onChange: (value: DeliveryChannel[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {CHANNEL_OPTIONS.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
        >
          <Checkbox
            checked={value.includes(option.value)}
            onCheckedChange={(checked) =>
              onChange(checked ? [...value, option.value] : value.filter((c) => c !== option.value))
            }
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function OrganizationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: organization, isLoading } = useOrganization(id);
  const { data: priceListsData } = usePriceLists({ active: "true", pageSize: 100 });
  const createOrganization = useCreateOrganization();
  const updateOrganization = useUpdateOrganization();
  const isPending = createOrganization.isPending || updateOrganization.isPending;

  const form = useForm<OrganizationFormSchemaType>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        type: organization.type,
        contactPerson: organization.contactPerson ?? "",
        mobile: organization.mobile,
        email: organization.email ?? "",
        country: organization.country ?? "",
        state: organization.state ?? "",
        city: organization.city ?? "",
        pincode: organization.pincode ?? "",
        address: organization.address ?? "",
        description: organization.description ?? "",
        priceListId: organization.priceListId ?? "",
        paymentType: organization.paymentType,
        creditLimit: organization.creditLimit,
        advanceAmount: organization.advanceAmount,
        dueDays: organization.dueDays,
        source: organization.source ?? "",
        billingRules: organization.billingRules ?? "",
        invoiceRules: organization.invoiceRules ?? "",
        reportDeliveryChannels: organization.reportDeliveryChannels,
        billDeliveryChannels: organization.billDeliveryChannels,
        active: organization.active,
      });
    }
  }, [organization, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = { ...values, priceListId: values.priceListId || undefined };
    try {
      if (isEdit && id) {
        await updateOrganization.mutateAsync({ id, values: payload });
        toast.success(`${values.name} updated successfully`);
      } else {
        const created = await createOrganization.mutateAsync(payload);
        toast.success(`${values.name} added successfully`);
        navigate(`/admin/organizations/${created.id}/edit`);
        return;
      }
    } catch (error) {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  });

  if (isEdit && isLoading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <PageHeader title="Edit Organization" description="Loading organization details…" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title={isEdit ? "Edit Organization" : "Add Organization"}
        description="Manage B2B partner details, billing configuration and portal access."
      />

      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <FormSection
            title="General Details"
            description="Identity and contact information"
            icon={Building2}
            index={0}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Sunrise Collection Center" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GENERAL_CENTER">General Center</SelectItem>
                      <SelectItem value="COLLECTION_CENTER">Collection Center</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" autoComplete="off" {...field} />
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
                    <Input placeholder="9876543210" autoComplete="off" {...field} />
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
                    <Input
                      type="email"
                      placeholder="contact@example.com"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="India" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="Maharashtra" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Mumbai" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <Input placeholder="400001" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Full address" autoComplete="off" {...field} />
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
                    <Textarea rows={2} placeholder="Notes about this organization…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border px-3.5 py-2.5">
                  <FormLabel className="cursor-pointer">Active</FormLabel>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection
            title="Financial & Billing"
            description="Pricing, credit terms and delivery preferences"
            icon={CreditCard}
            index={1}
          >
            <FormField
              control={form.control}
              name="priceListId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Price List</FormLabel>
                  <Select
                    value={field.value || "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Standard catalogue pricing" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Standard catalogue pricing</SelectItem>
                      {priceListsData?.rows.map((priceList) => (
                        <SelectItem key={priceList.id} value={priceList.id}>
                          {priceList.name}
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
              name="paymentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PREPAID">Prepaid</SelectItem>
                      <SelectItem value="POSTPAID">Postpaid / Credit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Limit (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="advanceAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advance Amount (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Days</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={365} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Direct, Referral Partner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billingRules"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Billing Rules</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Any special billing rules…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="invoiceRules"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Invoice Rules</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Any special invoicing rules…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reportDeliveryChannels"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Send Reports Via</FormLabel>
                  <ChannelCheckboxes value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billDeliveryChannels"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Send Bills Via</FormLabel>
                  <ChannelCheckboxes value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          <div className="flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/organizations")}
            >
              Cancel
            </Button>
            <RippleButton type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Organization"}
            </RippleButton>
          </div>
        </form>
      </Form>

      <OrganizationLoginPanel organization={organization ?? null} />

      {!isEdit && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <KeyRound className="size-3.5" /> Access & Permissions become available once the
          organization is saved.
        </p>
      )}

      {isEdit && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          Collection Center features (patient registration, sample collection, report download,
          invoice access) are controlled by the module permissions above.
        </p>
      )}
    </div>
  );
}

export { OrganizationFormPage };

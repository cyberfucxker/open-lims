import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { KeyRound } from "lucide-react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FormSection } from "@/components/common/FormSection";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useDisableOrganizationLogin,
  useEnableOrganizationLogin,
  useUpdateOrganizationLogin,
} from "@/hooks/queries/useOrganizations";
import { useRoles } from "@/hooks/queries/useRoles";
import {
  enableLoginFormSchema,
  updateLoginFormSchema,
  type EnableLoginFormSchemaType,
  type UpdateLoginFormSchemaType,
} from "@/schemas/organizationSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { Organization, OrganizationModule } from "@/types/organization";

const MODULE_OPTIONS: { value: OrganizationModule; label: string }[] = [
  { value: "patients", label: "Patient Registration" },
  { value: "samples", label: "Sample Collection" },
  { value: "reports", label: "Report Download" },
  { value: "invoices", label: "Invoice Access" },
];

function ModuleCheckboxes({
  value,
  onChange,
}: {
  value: OrganizationModule[];
  onChange: (value: OrganizationModule[]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:col-span-2">
      {MODULE_OPTIONS.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
        >
          <Checkbox
            checked={value.includes(option.value)}
            onCheckedChange={(checked) =>
              onChange(
                checked
                  ? [...value, option.value]
                  : value.filter((module) => module !== option.value),
              )
            }
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function EnableLoginForm({ organizationId }: { organizationId: string }) {
  const { data: roles } = useRoles();
  const enableLogin = useEnableOrganizationLogin();

  const form = useForm<EnableLoginFormSchemaType>({
    resolver: zodResolver(enableLoginFormSchema),
    defaultValues: { username: "", password: "", roleId: "", enabledModules: [] },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await enableLogin.mutateAsync({ id: organizationId, values });
      toast.success("Login enabled successfully");
      form.reset();
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to enable login");
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="cc_mumbai" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role Assignment</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles
                    ?.filter((role) => role.name !== "ADMIN")
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.label}
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
          name="enabledModules"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Module Permissions</FormLabel>
              <ModuleCheckboxes value={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={enableLogin.isPending}>
            <KeyRound className="size-4" />
            {enableLogin.isPending ? "Enabling…" : "Enable Login"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ManageLoginForm({ organization }: { organization: Organization }) {
  const login = organization.login!;
  const { data: roles } = useRoles();
  const updateLogin = useUpdateOrganizationLogin();
  const disableLogin = useDisableOrganizationLogin();

  const form = useForm<UpdateLoginFormSchemaType>({
    resolver: zodResolver(updateLoginFormSchema),
    defaultValues: {
      roleId: login.roleId,
      isActive: login.isActive,
      password: "",
      enabledModules: organization.enabledModules,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateLogin.mutateAsync({
        id: organization.id,
        values: { ...values, password: values.password || undefined },
      });
      toast.success("Login updated successfully");
      form.setValue("password", "");
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to update login");
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Username</Label>
          <Input value={login.username} disabled />
        </div>
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border px-3.5 py-2.5">
              <FormLabel className="cursor-pointer">Login Active</FormLabel>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role Assignment</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles
                    ?.filter((role) => role.name !== "ADMIN")
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.label}
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reset Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Leave blank to keep current" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="enabledModules"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Module Permissions</FormLabel>
              <ModuleCheckboxes value={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center gap-2.5 sm:col-span-2">
          <Button type="submit" disabled={updateLogin.isPending}>
            {updateLogin.isPending ? "Saving…" : "Save Login Settings"}
          </Button>
          <ConfirmDialog
            trigger={
              <Button type="button" variant="outline" className="text-destructive">
                Disable Login
              </Button>
            }
            title="Disable portal login?"
            description="This organization's portal user will no longer be able to sign in. You can re-enable it later without losing the account."
            confirmLabel="Disable"
            destructive
            onConfirm={async () => {
              try {
                await disableLogin.mutateAsync(organization.id);
                toast.success("Login disabled");
              } catch (error) {
                toast.error(
                  error instanceof ApiRequestError ? error.message : "Failed to disable login",
                );
                throw error;
              }
            }}
          />
        </div>
      </form>
    </Form>
  );
}

interface OrganizationLoginPanelProps {
  organization: Organization | null;
}

function OrganizationLoginPanel({ organization }: OrganizationLoginPanelProps) {
  if (!organization) {
    return (
      <FormSection
        title="Access & Permissions"
        description="Enable a portal login for this organization"
        icon={KeyRound}
      >
        <p className="text-sm text-muted-foreground sm:col-span-2">
          Save the organization first — login access can be enabled once it exists.
        </p>
      </FormSection>
    );
  }

  return (
    <FormSection
      title="Access & Permissions"
      description={
        organization.login
          ? "Manage this organization's portal login and module permissions"
          : "Enable login so this organization can access its own Collection Center portal"
      }
      icon={KeyRound}
    >
      <div className="sm:col-span-2">
        {organization.login ? (
          <ManageLoginForm organization={organization} />
        ) : (
          <EnableLoginForm organizationId={organization.id} />
        )}
      </div>
    </FormSection>
  );
}

export { OrganizationLoginPanel };

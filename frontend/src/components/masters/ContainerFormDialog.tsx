import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { RippleButton } from "@/components/common/RippleButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateContainer, useUpdateContainer } from "@/hooks/queries/useContainers";
import { containerFormSchema, type ContainerFormSchemaType } from "@/schemas/masterSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { Container } from "@/types/master";

const DEFAULT_VALUES: ContainerFormSchemaType = {
  name: "",
  code: "",
  color: "#a855f7",
  description: "",
  active: true,
};

interface ContainerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container?: Container | null;
}

function ContainerFormDialog({ open, onOpenChange, container }: ContainerFormDialogProps) {
  const isEdit = !!container;
  const createContainer = useCreateContainer();
  const updateContainer = useUpdateContainer();
  const isPending = createContainer.isPending || updateContainer.isPending;

  const form = useForm<ContainerFormSchemaType>({
    resolver: zodResolver(containerFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        container
          ? {
              name: container.name,
              code: container.code ?? "",
              color: container.color ?? "#a855f7",
              description: container.description ?? "",
              active: container.active,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, container, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit && container) {
        await updateContainer.mutateAsync({ id: container.id, values });
        toast.success(`${values.name} updated successfully`);
      } else {
        await createContainer.mutateAsync(values);
        toast.success(`${values.name} added to containers`);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Container" : "Add Container"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Container Name</FormLabel>
                    <FormControl>
                      <Input placeholder="EDTA Tube" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <input
                        type="color"
                        className="h-9 w-12 cursor-pointer rounded-md border border-input"
                        value={field.value || "#a855f7"}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="EDTA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Short description…" rows={2} {...field} />
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <RippleButton type="submit" disabled={isPending}>
                {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Container"}
              </RippleButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { ContainerFormDialog };

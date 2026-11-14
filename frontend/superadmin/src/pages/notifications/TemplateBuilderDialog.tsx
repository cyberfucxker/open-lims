import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type {
  NotificationChannel,
  TemplateApproval,
  TemplateCategory,
  UserAppNotificationTemplate,
} from "@/lib/types";

import { ChannelPreview } from "./ChannelPreview";
import {
  categoryLabel,
  channelLabel,
  extractVariables,
  INSERT_VARIABLES,
  NOTIFICATION_CHANNELS,
  TEMPLATE_CATEGORIES,
} from "./notificationHelpers";
import { SegmentedControl } from "./SegmentedControl";

interface TemplateBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: UserAppNotificationTemplate | null;
  onSave: (template: UserAppNotificationTemplate, isNew: boolean) => void;
}

function TemplateBuilderDialog({
  open,
  onOpenChange,
  template,
  onSave,
}: TemplateBuilderDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("order_confirmation");
  const [channel, setChannel] = useState<NotificationChannel>("whatsapp");
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    if (template) {
      setName(template.name);
      setCategory(template.category);
      setChannel(template.channel);
      setBody(template.body);
    } else {
      setName("");
      setCategory("order_confirmation");
      setChannel("whatsapp");
      setBody("");
    }
  }, [open, template]);

  const isNew = !template;
  const detectedVariables = extractVariables(body);

  function insertVariable(variable: string) {
    const token = `{${variable}}`;
    const el = textareaRef.current;
    if (!el) {
      setBody((b) => `${b}${token}`);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = `${body.slice(0, start)}${token}${body.slice(end)}`;
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("Template name is required.");
      return;
    }
    if (!body.trim()) {
      toast.error("Template body cannot be empty.");
      return;
    }

    let approval: TemplateApproval;
    if (isNew) {
      approval = "pending";
    } else if (channel === "whatsapp") {
      approval = "pending";
    } else {
      approval = template!.approval;
    }

    const finalTemplate: UserAppNotificationTemplate = {
      id: template?.id ?? `tmpl-${Date.now()}`,
      name: name.trim(),
      category,
      channel,
      body,
      variables: detectedVariables,
      approval,
      updatedAt: new Date().toISOString(),
    };

    onSave(finalTemplate, isNew);

    if (channel === "whatsapp") {
      toast.success(isNew ? "Template created" : "Template updated", {
        description:
          "WhatsApp Business templates must be approved by Meta before they can be sent. Status set to Pending.",
      });
    } else {
      toast.success(isNew ? "Template created" : "Template updated successfully.");
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-full max-w-full overflow-y-auto sm:max-w-4xl lg:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            {isNew ? "New Notification Template" : `Edit — ${template?.name}`}
          </DialogTitle>
          <DialogDescription>
            Compose the message and watch a live preview update on the right as you type.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tmpl-name">Template name</Label>
                <Input
                  id="tmpl-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Order Confirmed"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {categoryLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Channel</Label>
              <SegmentedControl
                ariaLabel="Channel"
                value={channel}
                onChange={setChannel}
                options={NOTIFICATION_CHANNELS.map((c) => ({ value: c, label: channelLabel(c) }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="tmpl-body">Message body</Label>
                <span className="text-xs text-muted-foreground">{body.length} chars</span>
              </div>
              <Textarea
                id="tmpl-body"
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={7}
                placeholder="Hi {customer_name}, your order {order_id} has been confirmed…"
                className="font-mono text-[13px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Insert variable at cursor</Label>
              <div className="flex flex-wrap gap-1.5">
                {INSERT_VARIABLES.map((v) => (
                  <Button
                    key={v}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full px-2.5 font-mono text-[11px]"
                    onClick={() => insertVariable(v)}
                  >
                    {`{${v}}`}
                  </Button>
                ))}
              </div>
            </div>

            {detectedVariables.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2">
                <span className="text-xs text-muted-foreground">Detected variables:</span>
                {detectedVariables.map((v) => (
                  <Badge key={v} variant="secondary" className="font-mono text-[10px]">
                    {`{${v}}`}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-0">
            <ChannelPreview channel={channel} body={body} title={name || "Open LIMS"} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{isNew ? "Create Template" : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { TemplateBuilderDialog };

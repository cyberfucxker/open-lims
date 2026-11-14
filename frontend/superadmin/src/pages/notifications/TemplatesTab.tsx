import { useMemo, useState } from "react";
import { FileText, Pencil, Plus } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusPill } from "@/components/common/StatusPill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import type {
  NotificationChannel,
  TemplateCategory,
  UserAppNotificationTemplate,
} from "@/lib/types";

import { TemplateBuilderDialog } from "./TemplateBuilderDialog";
import {
  categoryLabel,
  channelLabel,
  CHANNEL_ICONS,
  CHANNEL_TONE_CLASSES,
  NOTIFICATION_CHANNELS,
  TEMPLATE_CATEGORIES,
} from "./notificationHelpers";

interface TemplatesTabProps {
  templates: UserAppNotificationTemplate[];
  onSave: (template: UserAppNotificationTemplate, isNew: boolean) => void;
}

function TemplatesTab({ templates, onSave }: TemplatesTabProps) {
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");
  const [channelFilter, setChannelFilter] = useState<NotificationChannel | "all">("all");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<UserAppNotificationTemplate | null>(null);

  const filtered = useMemo(
    () =>
      templates.filter(
        (t) =>
          (categoryFilter === "all" || t.category === categoryFilter) &&
          (channelFilter === "all" || t.channel === channelFilter),
      ),
    [templates, categoryFilter, channelFilter],
  );

  function openNew() {
    setEditingTemplate(null);
    setBuilderOpen(true);
  }

  function openEdit(template: UserAppNotificationTemplate) {
    setEditingTemplate(template);
    setBuilderOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as TemplateCategory | "all")}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {TEMPLATE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {categoryLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={channelFilter}
            onValueChange={(v) => setChannelFilter(v as NotificationChannel | "all")}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              {NOTIFICATION_CHANNELS.map((c) => (
                <SelectItem key={c} value={c}>
                  {channelLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground">
            {filtered.length} of {templates.length} templates
          </span>

          <Button className="ml-auto" onClick={openNew}>
            <Plus className="size-4" />
            New Template
          </Button>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No templates match your filters"
          description="Try a different category or channel, or create a new template."
          action={
            <Button onClick={openNew}>
              <Plus className="size-4" />
              New Template
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((template, index) => {
            const Icon = CHANNEL_ICONS[template.channel];
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(index, 8) * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${CHANNEL_TONE_CLASSES[template.channel]}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{template.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {channelLabel(template.channel)}
                      </p>
                    </div>
                  </div>
                  <StatusPill status={template.approval} />
                </div>

                <Badge variant="outline" className="w-fit">
                  {categoryLabel(template.category)}
                </Badge>

                <p className="line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {template.body}
                </p>

                <div className="flex items-center justify-between border-t border-border/70 pt-3">
                  <span className="text-[11px] text-muted-foreground">
                    Updated {formatDate(template.updatedAt)}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => openEdit(template)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <TemplateBuilderDialog
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        template={editingTemplate}
        onSave={onSave}
      />
    </div>
  );
}

export { TemplatesTab };

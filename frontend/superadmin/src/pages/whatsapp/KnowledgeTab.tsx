import { useState } from "react";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteKnowledge, useKnowledge, useSaveKnowledge } from "@/hooks/queries/useWhatsapp";
import type { KnowledgeEntryDto } from "@/services/api/whatsappApi";

function Editor({ entry, onDone }: { entry: KnowledgeEntryDto | null; onDone: () => void }) {
  const save = useSaveKnowledge();
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [isActive, setIsActive] = useState(entry?.isActive ?? false);

  function submit() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and text are required.");
      return;
    }
    save.mutate(
      { id: entry?.id, values: { title: title.trim(), body: body.trim(), isActive } },
      {
        onSuccess: () => {
          toast.success("Saved.");
          onDone();
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
      },
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/30 p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="kb-title">Title</Label>
        <Input
          id="kb-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Fasting before blood tests"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="kb-body">Facts the assistant may state</Label>
        <Textarea id="kb-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={isActive} onCheckedChange={setIsActive} /> Active (the assistant reads only
        active entries)
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={save.isPending}>
          {save.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

function KnowledgeTab() {
  const { data, isLoading } = useKnowledge();
  const save = useSaveKnowledge();
  const remove = useDeleteKnowledge();
  const [editing, setEditing] = useState<KnowledgeEntryDto | "new" | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-5" /> Knowledge base
          </CardTitle>
          <CardDescription>
            FAQs the assistant may quote — fasting rules, home collection, report time, payment,
            refunds, hours. Every active entry is sent with each reply, so keep entries short and
            factual.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="size-4" /> Add entry
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {editing && (
          <Editor entry={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
        )}
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : !data?.length ? (
          <EmptyState
            icon={BookOpen}
            title="No entries yet"
            description="Run `npm run seed:whatsapp-samples -w backend` for reviewed-later samples."
          />
        ) : (
          data.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{entry.title}</p>
                  {entry.title.startsWith("SAMPLE") && (
                    <Badge variant="warning">needs review</Badge>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{entry.body}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Switch
                  checked={entry.isActive}
                  onCheckedChange={(isActive) =>
                    save.mutate({ id: entry.id, values: { isActive } })
                  }
                  aria-label="Active"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditing(entry)}
                  aria-label="Edit"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete"
                  onClick={() => {
                    if (window.confirm(`Delete "${entry.title}"?`)) remove.mutate(entry.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export { KnowledgeTab };

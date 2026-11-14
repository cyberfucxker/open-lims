import { useState } from "react";
import { Pencil, Plus, Stethoscope, Trash2, X } from "lucide-react";
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
import {
  useCatalogueSearch,
  useConcernMappings,
  useDeleteConcernMapping,
  useSaveConcernMapping,
} from "@/hooks/queries/useWhatsapp";
import type { CatalogueRef, ConcernMappingDto } from "@/services/api/whatsappApi";

function Editor({ mapping, onDone }: { mapping: ConcernMappingDto | null; onDone: () => void }) {
  const save = useSaveConcernMapping();
  const [concern, setConcern] = useState(mapping?.concern ?? "");
  const [keywords, setKeywords] = useState((mapping?.keywords ?? []).join(", "));
  const [tests, setTests] = useState<CatalogueRef[]>(mapping?.tests ?? []);
  const [packages, setPackages] = useState<CatalogueRef[]>(mapping?.packages ?? []);
  const [notes, setNotes] = useState(mapping?.notes ?? "");
  const [isActive, setIsActive] = useState(mapping?.isActive ?? false);
  const [q, setQ] = useState("");
  const { data: results } = useCatalogueSearch(q);

  function add(list: CatalogueRef[], set: (v: CatalogueRef[]) => void, item: CatalogueRef) {
    if (!list.some((x) => x.id === item.id)) set([...list, item]);
  }

  function submit() {
    save.mutate(
      {
        id: mapping?.id,
        values: {
          concern: concern.trim(),
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          testIds: tests.map((t) => t.id),
          packageIds: packages.map((p) => p.id),
          notes: notes.trim() || null,
          isActive,
        },
      },
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cm-concern">Concern</Label>
          <Input
            id="cm-concern"
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            placeholder="Fever / weakness"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cm-keywords">Keywords customers use (comma separated)</Label>
          <Input
            id="cm-keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="bukhar, fever, kamzori"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cm-search">Add tests / packages</Label>
        <Input
          id="cm-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the catalogue"
        />
        {q.trim().length >= 2 && results && (
          <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
            {results.packages.map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant="outline"
                onClick={() => add(packages, setPackages, p)}
              >
                <Plus className="size-3" /> {p.name} <Badge variant="info">package</Badge>
              </Button>
            ))}
            {results.tests.map((t) => (
              <Button
                key={t.id}
                size="sm"
                variant="outline"
                onClick={() => add(tests, setTests, t)}
              >
                <Plus className="size-3" /> {t.name}
              </Button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {[
            ...packages.map((p) => ({ ...p, kind: "package" as const })),
            ...tests.map((t) => ({ ...t, kind: "test" as const })),
          ].map((item) => (
            <Badge
              key={item.id}
              variant={item.kind === "package" ? "info" : "secondary"}
              className="gap-1"
            >
              {item.name}
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                onClick={() =>
                  item.kind === "package"
                    ? setPackages(packages.filter((p) => p.id !== item.id))
                    : setTests(tests.filter((t) => t.id !== item.id))
                }
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cm-notes">Notes for the assistant (optional)</Label>
        <Textarea id="cm-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={isActive} onCheckedChange={setIsActive} /> Active — reviewed by the medical
        team
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

function MappingTab() {
  const { data, isLoading } = useConcernMappings();
  const save = useSaveConcernMapping();
  const remove = useDeleteConcernMapping();
  const [editing, setEditing] = useState<ConcernMappingDto | "new" | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="size-5" /> Concern mapping
          </CardTitle>
          <CardDescription>
            The ONLY source for symptom-based suggestions. Curated by the medical team; the
            assistant suggests nothing for a concern that has no active mapping (it offers a Home
            Visit or a team member instead).
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="size-4" /> Add mapping
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {editing && (
          <Editor mapping={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
        )}
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : !data?.length ? (
          <EmptyState icon={Stethoscope} title="No mappings yet" />
        ) : (
          data.map((m) => (
            <div
              key={m.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{m.concern}</p>
                  {m.concern.startsWith("SAMPLE") && <Badge variant="warning">needs review</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Keywords: {m.keywords.join(", ") || "—"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {m.packages.map((p) => (
                    <Badge key={p.id} variant="info">
                      {p.name}
                    </Badge>
                  ))}
                  {m.tests.map((t) => (
                    <Badge key={t.id} variant="secondary">
                      {t.name}
                    </Badge>
                  ))}
                </div>
                {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Switch
                  checked={m.isActive}
                  onCheckedChange={(isActive) => save.mutate({ id: m.id, values: { isActive } })}
                  aria-label="Active"
                />
                <Button size="icon" variant="ghost" onClick={() => setEditing(m)} aria-label="Edit">
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete"
                  onClick={() => {
                    if (window.confirm(`Delete "${m.concern}"?`)) remove.mutate(m.id);
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

export { MappingTab };

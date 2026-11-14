import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateHomeFaq, useUpdateHomeFaq } from "@/hooks/queries/useHomeFaqs";
import type { HomeFaqDto, HomeFaqFormValues } from "@/services/api/homeFaqApi";

interface HomeFaqFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faq: HomeFaqDto | null;
}

interface FormState {
  question: string;
  answer: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = { question: "", answer: "", isActive: true };

function HomeFaqFormDialog({ open, onOpenChange, faq }: HomeFaqFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const createFaq = useCreateHomeFaq();
  const updateFaq = useUpdateHomeFaq();
  const isSaving = createFaq.isPending || updateFaq.isPending;

  useEffect(() => {
    if (!open) return;
    if (faq) {
      setForm({ question: faq.question, answer: faq.answer, isActive: faq.isActive });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, faq]);

  function handleSubmit() {
    if (!form.question.trim()) {
      toast.error("Enter a question.");
      return;
    }
    if (!form.answer.trim()) {
      toast.error("Enter an answer.");
      return;
    }

    const values: HomeFaqFormValues = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      isActive: form.isActive,
    };

    const onSettled = {
      onSuccess: () => {
        toast.success(faq ? "FAQ updated." : "FAQ added.");
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Something went wrong.");
      },
    };

    if (faq) {
      updateFaq.mutate({ id: faq.id, values }, onSettled);
    } else {
      createFaq.mutate(values, onSettled);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{faq ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          <DialogDescription>
            Shown in the Home page's FAQ accordion in the Example Lab patient app. Use the literal
            token <code>{"{city}"}</code> anywhere in the question or answer to have it replaced
            with the patient's selected city.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faq-question">Question *</Label>
            <Input
              id="faq-question"
              value={form.question}
              maxLength={300}
              placeholder="e.g. Do you offer free home sample collection in {city}?"
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faq-answer">Answer *</Label>
            <Textarea
              id="faq-answer"
              value={form.answer}
              rows={5}
              placeholder="e.g. Yes, our phlebotomists visit your home anywhere in {city}, free of charge."
              onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Active</span>
              <span className="text-xs text-muted-foreground">
                Show this FAQ on the Home page accordion
              </span>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : faq ? "Save Changes" : "Add FAQ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { HomeFaqFormDialog };

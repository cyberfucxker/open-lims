import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageSquareHeart,
  Phone,
  Send,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketingHero, Reveal } from "@/components/common/marketing";
import { ScreenshotDropzone } from "@/components/feedback/ScreenshotDropzone";
import { useReportIssue, useSupportTickets } from "@/hooks/queries/useSupport";
import type { SupportTicket, TicketStatus, TicketType } from "@/types";

const TYPE_LABEL: Record<TicketType, string> = {
  complaint: "Complaint",
  feedback: "Feedback",
};

const STATUS_BADGE: Record<
  TicketStatus,
  { label: string; variant: "warning" | "info" | "success" }
> = {
  open: { label: "Open", variant: "warning" },
  in_progress: { label: "In Progress", variant: "info" },
  closed: { label: "Closed", variant: "success" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TicketRow({ ticket, index }: { ticket: SupportTicket; index: number }) {
  const badge = STATUS_BADGE[ticket.status];
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{ticket.subject}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{ticket.description}</p>
        </div>
        <Badge variant={badge.variant} className="shrink-0">
          {badge.label}
        </Badge>
      </div>
      <p className="mt-2.5 text-[11px] text-muted-foreground">
        #{ticket.ticket_id} · {formatDate(ticket.created_at)}
      </p>
    </motion.li>
  );
}

function FeedbackPage() {
  const [type, setType] = useState<TicketType | "">("");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const reportIssue = useReportIssue();
  const { data: tickets, isLoading: ticketsLoading } = useSupportTickets();

  const descriptionTooShort = description.trim().length > 0 && description.trim().length < 10;
  const isValid = !!type && description.trim().length >= 10;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !type) return;

    // `subject` stays a required field on the backend for every existing
    // client — the picked type doubles as it now that there's no free-text
    // subject on screen.
    reportIssue.mutate(
      { subject: TYPE_LABEL[type], description: description.trim(), screenshot, type },
      {
        onSuccess: () => {
          setType("");
          setDescription("");
          setScreenshot(null);
        },
      },
    );
  }

  return (
    <div className="bg-background">
      <MarketingHero
        eyebrow="Feedback / Complaints"
        title="We're listening"
        subtitle="Tell us what went right, what didn't, or what we can fix — every message reaches our support team directly."
      />

      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Form */}
          <Reveal>
            <Card className="relative overflow-hidden">
              <div
                aria-hidden
                className="absolute -top-16 -right-16 size-48 rounded-full bg-primary/[0.06] blur-3xl"
              />
              <CardContent className="relative space-y-5 pt-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <MessageSquareHeart className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      Share your feedback/complaint
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      We typically respond within 24 hours
                    </p>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <Label htmlFor="fb-type">Subject</Label>
                    <Select value={type} onValueChange={(v) => setType(v as TicketType)}>
                      <SelectTrigger id="fb-type" className="h-11">
                        <SelectValue placeholder="Complaint or feedback?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complaint">Complaint</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fb-description">What happened?</Label>
                    <Textarea
                      id="fb-description"
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell us the details — order number, date, and what you experienced"
                      className="resize-none"
                      maxLength={2000}
                      aria-invalid={descriptionTooShort}
                    />
                    <div className="flex items-center justify-between">
                      {descriptionTooShort ? (
                        <p className="flex items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="size-3" />
                          At least 10 characters
                        </p>
                      ) : (
                        <span />
                      )}
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {description.length}/2000
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      Screenshot <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <ScreenshotDropzone
                      file={screenshot}
                      onChange={setScreenshot}
                      disabled={reportIssue.isPending}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full"
                    disabled={reportIssue.isPending || !isValid}
                  >
                    {reportIssue.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {reportIssue.isPending ? "Sending..." : "Submit"}
                  </Button>

                  {reportIssue.isSuccess && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="size-4" />
                      Thanks — your message has been sent to our team.
                    </motion.p>
                  )}
                </form>
              </CardContent>
            </Card>
          </Reveal>

          {/* My submissions + direct contact */}
          <Reveal delay={0.1} className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-foreground">Your submissions</h2>
              <p className="text-xs text-muted-foreground">
                Every message you've sent us, newest first
              </p>
              <ul className="mt-3 space-y-2.5">
                {ticketsLoading ? (
                  <>
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </>
                ) : tickets && tickets.length > 0 ? (
                  tickets.map((t, i) => <TicketRow key={t.id} ticket={t} index={i} />)
                ) : (
                  <li className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                    Nothing submitted yet — your first message will show up here.
                  </li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Phone className="size-4 text-primary" />
                Need it resolved right away?
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Call our support line and we'll help you immediately.
              </p>
              <Button variant="outline" className="mt-3 w-full" asChild>
                <a href="tel:+919876543210">+91 98765 43210</a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

export { FeedbackPage };

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EASE_OUT_EXPO } from "@/utils/motion";

function ServicePinCard({ pin }: { pin: string }) {
  const [copied, setCopied] = useState(false);

  const copyPin = () => {
    navigator.clipboard?.writeText(pin).catch(() => undefined);
    toast.success("PIN copied");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      aria-label="Service PIN"
      className="relative overflow-hidden rounded-2xl bg-primary p-5 text-white shadow-xl shadow-black/15 ring-1 ring-white/10"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]"
      />
      <div
        aria-hidden
        className="absolute -top-16 -right-10 size-44 rounded-full bg-white/15 blur-3xl"
      />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20"
          >
            <KeyRound className="size-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-white/70 uppercase">
              Service PIN
            </p>
            <p className="text-3xl leading-tight font-bold tracking-[0.25em] tabular-nums">{pin}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="max-w-44 text-xs leading-relaxed text-white/75">
            Share this with your phlebotomist when they arrive.
          </p>
          <Button
            variant="outline"
            size="icon"
            onClick={copyPin}
            aria-label="Copy service PIN"
            className="size-10 shrink-0 border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

export { ServicePinCard };

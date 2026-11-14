import { useRef } from "react";
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from "react";
import { motion, useAnimation } from "framer-motion";

import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

/** What the page's verify call is doing right now. The field itself only
 *  reacts to `shakeTrigger`; the label under it spells the state out. */
export type OtpStatus = "idle" | "verifying" | "success" | "error";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  /** Bump this number (e.g. on each failed verify attempt) to trigger a shake animation. */
  shakeTrigger?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  shakeTrigger,
  disabled = false,
  autoFocus = true,
  className,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const controls = useAnimation();
  const lastShakeTrigger = useRef(shakeTrigger);

  if (shakeTrigger !== undefined && shakeTrigger !== lastShakeTrigger.current) {
    lastShakeTrigger.current = shakeTrigger;
    void controls.start({ x: [0, -8, 8, -8, 0], transition: { duration: 0.35 } });
  }

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const commitValue = (next: string[]) => {
    const nextValue = next.join("").slice(0, length);
    onChange(nextValue);
    if (nextValue.length === length && next.slice(0, length).every((d) => d !== "")) {
      onComplete?.(nextValue);
    }
    return nextValue;
  };

  const handleChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/\D/g, "");

    if (!raw) {
      const next = digits.slice();
      next[index] = "";
      commitValue(next);
      return;
    }

    const chars = raw.split("");
    const next = digits.slice();
    chars.forEach((char, offset) => {
      if (index + offset < length) {
        next[index + offset] = char;
      }
    });
    commitValue(next);

    const lastFilledIndex = Math.min(index + chars.length, length - 1);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (index: number) => (event: ClipboardEvent<HTMLInputElement>) => {
    const raw = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!raw) return;
    event.preventDefault();

    const chars = raw.split("");
    const next = digits.slice();
    chars.forEach((char, offset) => {
      if (index + offset < length) {
        next[index + offset] = char;
      }
    });
    commitValue(next);

    const lastFilledIndex = Math.min(index + chars.length, length - 1);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  return (
    <motion.div animate={controls} className={cn("flex justify-between gap-2", className)}>
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(el: HTMLInputElement | null) => {
            inputRefs.current[index] = el;
          }}
          value={digit}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          onPaste={handlePaste(index)}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          aria-label={`OTP digit ${index + 1}`}
          className="h-12 w-full px-0 text-center text-lg font-semibold"
        />
      ))}
    </motion.div>
  );
}

export { OtpInput };

import { useRef, useState, type KeyboardEvent } from "react";

import { Input } from "@/components/ui/input";
import { ageToDob, computeAge } from "@/utils/age";
import { cn } from "@/utils/cn";

interface DobInputProps {
  id?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  invalid?: boolean;
  className?: string;
}

/** Age-only entry (years) — the front desk types an age like "26", and this
 *  commits an approximated ISO `dob` (see `ageToDob`) since that's the only
 *  thing the backend/`Patient.dob` column understands. */
function DobInput({ id, value, onChange, onKeyDown, invalid, className }: DobInputProps) {
  const [ageText, setAgeText] = useState(() => String(computeAge(value ?? "")?.years ?? ""));
  // Tracks the last value *we* emitted, so external changes (form.reset,
  // patient lookup) resync the displayed age without clobbering it
  // mid-keystroke — normalized the same way the parent normalizes it
  // (`v ?? ""`).
  const lastEmitted = useRef(value ?? "");
  if ((value ?? "") !== lastEmitted.current) {
    lastEmitted.current = value ?? "";
    const nextAgeText = String(computeAge(value ?? "")?.years ?? "");
    if (nextAgeText !== ageText) setAgeText(nextAgeText);
  }

  const handleAgeChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 3);
    setAgeText(digits);
    const years = Number(digits);
    const iso = digits && years > 0 && years < 130 ? ageToDob(years) : undefined;
    lastEmitted.current = iso ?? "";
    onChange(iso);
  };

  return (
    <Input
      id={id}
      inputMode="numeric"
      autoComplete="off"
      placeholder="e.g. 26"
      maxLength={3}
      value={ageText}
      invalid={invalid}
      onChange={(e) => handleAgeChange(e.target.value)}
      onKeyDown={onKeyDown}
      className={cn("min-w-0 flex-1", className)}
    />
  );
}

export { DobInput };

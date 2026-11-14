import type { KeyboardEvent } from "react";

const FOCUSABLE_SELECTOR =
  'input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

function isVisible(el: HTMLElement) {
  return el.offsetParent !== null;
}

/** Moves focus to the next focusable element in DOM order after `current`. */
export function focusNextElement(current: HTMLElement, root: ParentNode = document) {
  const all = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible);
  const idx = all.indexOf(current);
  if (idx === -1) return;
  const next = all[idx + 1];
  next?.focus();
}

/** Attach to a plain text input's onKeyDown so Enter advances focus instead of no-op/submit. */
export function advanceOnEnter(e: KeyboardEvent<HTMLElement>) {
  if (e.key === "Enter") {
    e.preventDefault();
    focusNextElement(e.currentTarget);
  }
}

/**
 * For popover-based controls (Select/SearchableSelect/DatePicker): call after
 * a value is chosen. Radix returns focus to the trigger on close, so by the
 * time this runs `document.activeElement` is the trigger — advance from there.
 */
export function focusNextFromActiveElement() {
  const el = document.activeElement;
  if (el instanceof HTMLElement) focusNextElement(el);
}

/** Focuses the first input inside a container (for libraries like cmdk that own their input's id). */
export function focusInputWithin(containerSelector: string) {
  document.querySelector<HTMLInputElement>(`${containerSelector} input`)?.focus();
}

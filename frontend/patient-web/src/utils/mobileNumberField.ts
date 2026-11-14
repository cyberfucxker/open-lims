import type { ChangeEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

/** Every Indian mobile number the app accepts is exactly this long — the same
 *  length `Address.phone`, `AppUser.mobile` and `FamilyMember.mobileNo` are
 *  validated to on the backend. */
export const MOBILE_NUMBER_LENGTH = 10;

/** Strips a number down to the ten digits the API will accept.
 *
 *  `type="tel"` does NOT restrict what can be typed — it only hints at a phone
 *  keypad — so without this a desktop user can type letters and punctuation
 *  into a mobile field and only find out it was wrong when the form is
 *  submitted.
 *
 *  A pasted number is the case worth being careful about: people copy numbers
 *  as "+91 98765 43210" or "098765 43210" from a contact card or a WhatsApp
 *  message. Dropping non-digits alone would leave "919876543210", and taking
 *  the first ten of that gives "9198765432" — a real-looking but wrong number,
 *  saved silently. So a 91 or 0 dialling prefix is removed before the length
 *  is applied.
 */
export function toMobileNumber(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  if (digits.length > MOBILE_NUMBER_LENGTH) {
    if (digits.startsWith("91")) digits = digits.slice(2);
    else if (digits.startsWith("0")) digits = digits.slice(1);
  }

  return digits.slice(0, MOBILE_NUMBER_LENGTH);
}

/** Spread over an `<Input>` in place of `{...register("mobile")}`.
 *
 *  Sanitising in `onChange` rather than blocking keys in `onKeyDown` is
 *  deliberate: a keydown filter has to allow-list every non-typing key by hand
 *  and still misses right-click paste, drag-and-drop and browser autofill,
 *  while typically also swallowing Ctrl+A/C/V because those arrive as the
 *  letter key. Cleaning the value on the way through covers all of them, and
 *  react-hook-form then receives the value the API will actually take.
 */
export function mobileNumberField(field: UseFormRegisterReturn) {
  return {
    ...field,
    type: "tel" as const,
    inputMode: "numeric" as const,
    autoComplete: "tel" as const,
    // Deliberately NO `maxLength`: the browser applies it to the RAW text, so
    // pasting "+91 98765 43210" would be truncated to "+91 98765 " before this
    // handler ever runs, and the dialling prefix could no longer be told from
    // the number — it silently became "9198765". The ten-digit cap lives in
    // `toMobileNumber` instead, after the non-digits are gone.
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      event.target.value = toMobileNumber(event.target.value);
      return field.onChange(event);
    },
  };
}

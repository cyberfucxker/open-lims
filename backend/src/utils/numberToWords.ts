const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(value: number): string {
  if (value < 20) return ONES[value];
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return ones ? `${TENS[tens]} ${ONES[ones]}` : TENS[tens];
}

function threeDigits(value: number): string {
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const parts = [];
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" ");
}

/** Indian numbering system (lakh/crore) — e.g. 750 -> "Seven Hundred Fifty",
 *  123456 -> "One Lakh Twenty Three Thousand Four Hundred Fifty Six". */
function integerToWords(value: number): string {
  if (value === 0) return "Zero";

  const crore = Math.floor(value / 10000000);
  const lakh = Math.floor((value % 10000000) / 100000);
  const thousand = Math.floor((value % 100000) / 1000);
  const hundred = value % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));

  return parts.join(" ");
}

/** Formats a rupee amount for the invoice's "Amount In Words" line, e.g.
 *  750 -> "Seven Hundred Fifty Rupees Only", 750.5 -> "... And Fifty Paise Only". */
export function amountToWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  const rupeeWords = `${integerToWords(rupees)} Rupees`;
  const paiseWords = paise > 0 ? ` And ${integerToWords(paise)} Paise` : "";

  return `${rupeeWords}${paiseWords} Only`;
}

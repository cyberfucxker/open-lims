/** Splits a single "Full Name" input into first/last name for storage —
 *  last word is the last name, everything before it is the first name
 *  (matches the same convention the frontend's mock service already used). */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

export function joinFullName(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(" ");
}

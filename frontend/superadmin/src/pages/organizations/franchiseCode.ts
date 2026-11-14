/**
 * Client-side mirror of the backend's `deriveFranchiseCodeBase`
 * (`backend/src/utils/franchiseCode.ts`), used ONLY to show a live preview of
 * the code as the operator types the franchise name.
 *
 * The server is authoritative: it also resolves collisions (appending 2, 3, …)
 * and falls back to the ORG###### sequence, neither of which can be known here.
 * The preview is therefore labelled as such, and the created franchise may come
 * back with a suffixed code.
 *
 * Kept in sync with the backend by hand. It is ~15 lines of pure string work
 * with no runtime dependency, which is a smaller cost than the shared-package
 * plumbing this project does not otherwise have.
 */

const MAX_BASE_LENGTH = 6;

export function deriveFranchiseCodeBase(name: string): string {
  const words = name
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.toUpperCase());

  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, MAX_BASE_LENGTH);

  return words
    .slice(0, MAX_BASE_LENGTH)
    .map((word) => word[0])
    .join("");
}

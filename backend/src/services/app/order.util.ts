import { prisma } from "../../config/database";
import type { CatalogItemType } from "@prisma/client";

/** Expands one cart line into the flat list of `Test.id`s it books — a
 *  package never gets billed at its own flat price (see the `Package`
 *  model's doc-comment); it always expands to its constituent tests at
 *  their live `Test.price`, exactly like the admin Patient Registration
 *  screen's own package selection.
 *
 *  Deliberately still Test-id-only after the catalogue rebuild: billing,
 *  `AppointmentTest`, and report scaffolding are all keyed on `Test.id`, and
 *  keeping this contract byte-identical is what let the Parameter/Package
 *  reshape land without touching bill generation. A Package's own standalone
 *  `Parameter` members therefore do NOT contribute billable lines yet — they're
 *  catalogue/display information (`bookable`) until parameter-level booking is
 *  built out. `catalog.service.ts#addToCart` refuses a package that has no
 *  member tests so that gap surfaces at add-to-cart rather than as an opaque
 *  failure at checkout. */
export async function expandToTestIds(
  itemType: CatalogItemType,
  itemId: string,
): Promise<string[]> {
  if (itemType === "TEST") {
    return [itemId];
  }
  const packageTests = await prisma.packageTest.findMany({ where: { packageId: itemId } });
  return packageTests.map((pt) => pt.testId);
}

export interface CartLine {
  id: string;
  itemType: CatalogItemType;
  itemId: string;
  familyMemberId: string | null;
}

export interface FamilyMemberGroup {
  familyMemberId: string;
  lines: CartLine[];
}

/** Groups cart lines by who they're for — one real `Appointment` gets
 *  created per group at Confirm Order time (LIMS's `Appointment` is
 *  one-patient-per-row). */
export function groupByFamilyMember(lines: CartLine[]): FamilyMemberGroup[] {
  const groups = new Map<string, CartLine[]>();
  for (const line of lines) {
    if (!line.familyMemberId) continue; // no profile/self yet — excluded, caller validates this is empty
    const existing = groups.get(line.familyMemberId);
    if (existing) {
      existing.push(line);
    } else {
      groups.set(line.familyMemberId, [line]);
    }
  }
  return Array.from(groups.entries()).map(([familyMemberId, groupLines]) => ({
    familyMemberId,
    lines: groupLines,
  }));
}

import { prisma } from "../config/database";
import type { HomeSeoContentDto } from "../types/homeSeoContent.types";

const SINGLETON_ID = "default";

/** Seeded the first time anyone ever calls `getOrCreate...` — written once,
 *  editable from Superadmin CMS → Home FAQ tab from then on. `{city}` is a
 *  literal token the patient app substitutes at render time, same as
 *  `HomeFaq.question`/`answer` — see that model's doc-comment. */
const DEFAULT_HEADING = "Your Trusted Diagnostic Partner";
const DEFAULT_BODY = `<p>Choosing the right diagnostic centre matters — every treatment decision your doctor makes starts with an accurate report. Example Diagnostics Lab brings NABL-accredited testing, free home sample collection, and digital reports straight to your phone, wherever you are in {city}.</p><p>Our trained phlebotomists visit your home at a time you choose, follow strict safety protocols for every sample, and our labs process results with the same rigour whether you're booking a single test or a full health package. No waiting rooms, no travel — just dependable results, on time.</p><p>From routine blood work to comprehensive full-body checkups, thousands of patients in {city} and across the country trust us for accurate diagnostics and a genuinely convenient booking experience, from your first click to your final report.</p>`;

export function toHomeSeoContentDto(row: {
  heading: string;
  body: string;
  updatedAt: Date;
}): HomeSeoContentDto {
  return { heading: row.heading, body: row.body, updatedAt: row.updatedAt.toISOString() };
}

export function getOrCreateHomeSeoContent() {
  return prisma.homeSeoContent.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID, heading: DEFAULT_HEADING, body: DEFAULT_BODY },
  });
}

export function updateHomeSeoContent(data: { heading: string; body: string }) {
  return prisma.homeSeoContent.upsert({
    where: { id: SINGLETON_ID },
    update: data,
    create: { id: SINGLETON_ID, ...data },
  });
}

import type { Prisma, WebBannerPlacement } from "@prisma/client";
import { prisma } from "../config/database";
import type { WebBannerDto } from "../types/webBanner.types";

/** Every read here pulls the linked package's name/slug alongside the row —
 *  the admin list needs to say WHICH package a slide promotes, and the
 *  patient-side mapper needs the slug to build the detail link. */
const webBannerInclude = {
  package: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.WebBannerInclude;

export type WebBannerRow = Prisma.WebBannerGetPayload<{ include: typeof webBannerInclude }>;

export interface ListWebBannersFilter {
  placement?: WebBannerPlacement;
  isActive?: string;
  skip: number;
  take: number;
}

export interface WebBannerWriteInput {
  placement: WebBannerPlacement;
  badge?: string | null;
  title?: string | null;
  subtitle?: string | null;
  imageUrl: string;
  packageId?: string | null;
  linkUrl?: string | null;
  isActive?: boolean;
}

export function toWebBannerDto(row: WebBannerRow): WebBannerDto {
  return {
    id: row.id,
    placement: row.placement,
    badge: row.badge,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.imageUrl,
    packageId: row.packageId,
    packageName: row.package?.name ?? null,
    linkUrl: row.linkUrl,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListWebBannersFilter, "isActive" | "placement">,
): Prisma.WebBannerWhereInput {
  const where: Prisma.WebBannerWhereInput = {};
  if (filter.placement) where.placement = filter.placement;
  if (filter.isActive === "true") where.isActive = true;
  if (filter.isActive === "false") where.isActive = false;
  return where;
}

export async function listWebBanners(
  filter: ListWebBannersFilter,
): Promise<{ rows: WebBannerRow[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.webBanner.findMany({
      where,
      include: webBannerInclude,
      orderBy: { sortOrder: "asc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.webBanner.count({ where }),
  ]);

  return { rows, total };
}

/** Active slides for one of the patient site's two mastheads, in carousel
 *  order. Always scoped to a placement: the Home hero and a city page are
 *  separate lists, and serving one the other's slides is the bug this
 *  argument exists to prevent. */
export function listActiveWebBanners(placement: WebBannerPlacement): Promise<WebBannerRow[]> {
  return prisma.webBanner.findMany({
    where: { placement, isActive: true },
    include: webBannerInclude,
    orderBy: { sortOrder: "asc" },
  });
}

export function findWebBannerById(id: string) {
  return prisma.webBanner.findUnique({ where: { id }, include: webBannerInclude });
}

/** Per placement: the two lists are ordered independently, so the first HOME
 *  banner starts at 0 even when a dozen CITY ones already exist. */
async function nextSortOrder(placement: WebBannerPlacement): Promise<number> {
  const last = await prisma.webBanner.findFirst({
    where: { placement },
    orderBy: { sortOrder: "desc" },
  });
  return (last?.sortOrder ?? -1) + 1;
}

/** `undefined` leaves a column alone, `null` clears it — the difference
 *  matters on update, where a form that doesn't send `subtitle` must not
 *  wipe the existing one. */
function toWriteData(data: WebBannerWriteInput) {
  return {
    placement: data.placement,
    badge: data.badge ?? null,
    // A HOME banner carries no copy, so anything typed before switching the
    // placement is dropped rather than stored where nothing will render it.
    title: data.placement === "HOME" ? null : (data.title ?? null),
    subtitle: data.subtitle ?? null,
    imageUrl: data.imageUrl,
    packageId: data.packageId ?? null,
    linkUrl: data.linkUrl ?? null,
    isActive: data.isActive,
  };
}

export async function createWebBanner(data: WebBannerWriteInput) {
  const sortOrder = await nextSortOrder(data.placement);
  return prisma.webBanner.create({
    data: { ...toWriteData(data), sortOrder, isActive: data.isActive ?? true },
    include: webBannerInclude,
  });
}

export function updateWebBanner(id: string, data: WebBannerWriteInput) {
  return prisma.webBanner.update({
    where: { id },
    data: toWriteData(data),
    include: webBannerInclude,
  });
}

export function setWebBannerStatus(id: string, isActive: boolean) {
  return prisma.webBanner.update({ where: { id }, data: { isActive }, include: webBannerInclude });
}

export function deleteWebBanner(id: string) {
  return prisma.webBanner.delete({ where: { id } });
}

export function reorderWebBanners(ids: string[]) {
  return prisma.$transaction(
    ids.map((id, index) => prisma.webBanner.update({ where: { id }, data: { sortOrder: index } })),
  );
}

export type CmsAppType = "USER" | "PHLEBO";
export type CmsPageStatus = "DRAFT" | "PUBLISHED";

export const CMS_APP_TYPE_VALUES: CmsAppType[] = ["USER", "PHLEBO"];
export const CMS_PAGE_STATUS_VALUES: CmsPageStatus[] = ["DRAFT", "PUBLISHED"];

export interface CmsPageDto {
  id: string;
  appType: CmsAppType;
  title: string;
  slug: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  status: CmsPageStatus;
  publicUrl: string;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Slim row shape for the admin list grid — omits `content` so listing 13+
 *  pages doesn't ship every page's full HTML body over the wire. */
export interface CmsPageListItem {
  id: string;
  appType: CmsAppType;
  title: string;
  slug: string;
  metaTitle: string | null;
  status: CmsPageStatus;
  publicUrl: string;
  updatedAt: string;
}

export interface CmsPageWriteData {
  appType: CmsAppType;
  title: string;
  /** Optional on create — auto-slugified from `title` when omitted/blank. */
  slug?: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  status?: CmsPageStatus;
}

export interface ListCmsPagesParams {
  appType?: CmsAppType;
  status?: CmsPageStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListCmsPagesResult {
  rows: CmsPageListItem[];
  total: number;
}

/** Shape returned by the public `GET /api/v1/cms/:appType/:slug` endpoint —
 *  intentionally excludes audit fields (createdByUserId/updatedByUserId). */
export interface PublicCmsPageDto {
  title: string;
  slug: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
}

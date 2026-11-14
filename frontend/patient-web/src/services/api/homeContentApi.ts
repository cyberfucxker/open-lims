import { httpClient } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type { HomeFaq, HomeSeoContent } from "@/types";

/** `GET /user/home-faqs` — active FAQs only, already in display order. */
export async function getHomeFaqs(): Promise<HomeFaq[]> {
  const response = await httpClient.get<AppApiResponseBody<HomeFaq[]>>("/user/home-faqs");
  return response.data.data ?? [];
}

/** `GET /user/home-seo-content` — singleton rich-text intro block. */
export async function getHomeSeoContent(): Promise<HomeSeoContent | null> {
  const response =
    await httpClient.get<AppApiResponseBody<HomeSeoContent>>("/user/home-seo-content");
  return response.data.data;
}

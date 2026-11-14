/** `GET /user/home-faqs` row — `question`/`answer` may contain a literal
 *  "{city}" token, substituted client-side (see `lib/cityToken.ts`). */
export interface HomeFaq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}

/** `GET /user/home-seo-content` — singleton rich-text intro block for the
 *  Home page. `body` is HTML and may also contain a "{city}" token. */
export interface HomeSeoContent {
  heading: string;
  body: string;
}

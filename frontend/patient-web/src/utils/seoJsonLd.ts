export interface BreadcrumbItem {
  label: string;
  /** Site-relative path, e.g. "/". Omit on the last (current-page) item. */
  path?: string;
}

/** Builds a schema.org `BreadcrumbList` node (no `@context` — nested under
 *  the page's own `@graph`, see `HomePage.tsx`). */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.path ? { item: `${window.location.origin}${item.path}` } : {}),
    })),
  };
}

/** Builds a schema.org `FAQPage` node from already-city-substituted FAQ
 *  question/answer pairs. */
export function buildFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** Builds a schema.org `Service` node for a city landing page — what is
 *  offered, by whom, where.
 *
 *  Deliberately `Service` with an `areaServed`, not `MedicalBusiness`: that
 *  type is a physical place and wants a street address and opening hours,
 *  and inventing either per city to satisfy a schema validator would be a
 *  lie told in structured data. Home collection genuinely is a service
 *  covering a city. */
export function buildCityServiceJsonLd(cityName: string) {
  return {
    "@type": "Service",
    name: `Diagnostic lab tests and health checkups in ${cityName}`,
    serviceType: "Diagnostic testing with home sample collection",
    provider: { "@type": "Organization", name: "Example Diagnostics Lab" },
    areaServed: { "@type": "City", name: cityName },
  };
}

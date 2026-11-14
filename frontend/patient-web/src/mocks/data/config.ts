import type { AppConfigResult } from "@/types";

export const MOCK_CONFIG: AppConfigResult = {
  min_supported_version: "1.0.0",
  latest_version: "1.4.0",
  force_update: false,
  update_url: null,
  cms_links: {
    blog_url: "https://example.com/blog",
    faq_url: "https://example.com/faq",
    privacy_policy_url: "https://example.com/privacy",
    terms_url: "https://example.com/terms",
  },
  support_contact: {
    phone: "+91 90000 00000",
    whatsapp: "+91 90000 00000",
    email: "info@example.com",
  },
};

export interface AppConfigResult {
  min_supported_version: string;
  latest_version: string;
  force_update: boolean;
  update_url: string | null;
  cms_links: {
    blog_url: string;
    faq_url: string;
    privacy_policy_url: string;
    terms_url: string;
  };
  support_contact: {
    phone: string;
    whatsapp: string;
    email: string;
  };
}

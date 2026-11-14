import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";

export async function getAppConfig(appVersion?: string) {
  const config = await prisma.appConfig.findFirst();
  if (!config) {
    throw ApiError.internal("App configuration is not seeded yet");
  }

  const forceUpdate = appVersion
    ? isOlder(appVersion, config.minSupportedVersion)
    : config.forceUpdate;

  return {
    min_supported_version: config.minSupportedVersion,
    latest_version: config.latestVersion,
    force_update: forceUpdate,
    update_url: config.updateUrl,
    cms_links: {
      blog_url: config.blogUrl,
      faq_url: config.faqUrl,
      privacy_policy_url: config.privacyPolicyUrl,
      terms_url: config.termsUrl,
    },
    support_contact: {
      phone: config.supportPhone,
      whatsapp: config.supportWhatsapp,
      email: config.supportEmail,
    },
  };
}

function isOlder(version: string, minVersion: string): boolean {
  const a = version.split(".").map(Number);
  const b = minVersion.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff < 0;
  }
  return false;
}

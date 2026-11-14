import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";

async function getConfig() {
  const config = await prisma.appConfig.findFirst();
  if (!config) {
    throw ApiError.internal("App configuration is not seeded yet");
  }
  return config;
}

export interface ContentPage {
  title: string;
  content: string;
  updated_at: string;
}

export async function getTermsAndConditions(): Promise<ContentPage> {
  const config = await getConfig();
  return {
    title: "Terms & Conditions",
    content: config.termsContent ?? "",
    updated_at: config.updatedAt.toISOString().slice(0, 10),
  };
}

export async function getPrivacyPolicy(): Promise<ContentPage> {
  const config = await getConfig();
  return {
    title: "Privacy Policy",
    content: config.privacyPolicyContent ?? "",
    updated_at: config.updatedAt.toISOString().slice(0, 10),
  };
}

export interface HelpSupport {
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  address: string | null;
  working_hours: string | null;
  faqs: unknown;
}

export async function getHelpSupport(): Promise<HelpSupport> {
  const config = await getConfig();
  return {
    phone: config.supportPhone,
    email: config.supportEmail,
    whatsapp: config.supportWhatsapp,
    address: config.supportAddress,
    working_hours: config.helpWorkingHours,
    faqs: config.helpFaqs,
  };
}

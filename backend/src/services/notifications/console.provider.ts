import { logger } from "../../utils/logger";
import type { NotificationProvider, NotificationResult } from "./notification.interface";

/** Default `NotificationProvider` — logs the send instead of calling a real
 *  provider, and always reports success so the Send Invoice flow (API,
 *  validation, `InvoiceSendLog` history) is fully exercisable before real
 *  WhatsApp/SMTP/SMS credentials exist. */
class ConsoleNotificationProvider implements NotificationProvider {
  async sendWhatsApp(
    to: string,
    message: string,
    attachment?: Buffer,
  ): Promise<NotificationResult> {
    logger.info(
      `[notifications:whatsapp] to=${to} attachment=${attachment ? "yes" : "no"} message="${message}"`,
    );
    return { success: true, providerMessageId: `console-whatsapp-${Date.now()}` };
  }

  async sendEmail(
    to: string,
    subject: string,
    message: string,
    attachment?: Buffer,
  ): Promise<NotificationResult> {
    logger.info(
      `[notifications:email] to=${to} subject="${subject}" attachment=${attachment ? "yes" : "no"} message="${message}"`,
    );
    return { success: true, providerMessageId: `console-email-${Date.now()}` };
  }

  async sendSms(to: string, message: string): Promise<NotificationResult> {
    logger.info(`[notifications:sms] to=${to} message="${message}"`);
    return { success: true, providerMessageId: `console-sms-${Date.now()}` };
  }
}

export const notificationProvider: NotificationProvider = new ConsoleNotificationProvider();

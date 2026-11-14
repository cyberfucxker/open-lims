export interface NotificationResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

/**
 * Delivery interface for the Send Invoice feature. No WhatsApp/Twilio/SMTP
 * credentials exist in this project yet (see `auth.service.ts`'s note that no
 * email/SMS transport exists yet either) — `console.provider.ts` is the
 * default implementation so the feature is fully wired end-to-end (API,
 * validation, delivery logging) and a real provider can be dropped in later
 * behind this same interface without touching `bill.service.ts`.
 */
export interface NotificationProvider {
  sendWhatsApp(to: string, message: string, attachment?: Buffer): Promise<NotificationResult>;
  sendEmail(
    to: string,
    subject: string,
    message: string,
    attachment?: Buffer,
  ): Promise<NotificationResult>;
  sendSms(to: string, message: string): Promise<NotificationResult>;
}

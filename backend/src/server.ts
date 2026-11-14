import { createApp } from "./app";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { logger } from "./utils/logger";
import { regenerateSitemap } from "./services/sitemapGenerator.service";
import { startReminderJob } from "./services/whatsapp/templates.service";
import { startFollowUpJob } from "./services/whatsapp/followUp.service";

async function bootstrap(): Promise<void> {
  await connectDatabase();
  logger.info("Database connected");

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Backend server listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // Without this, a busy port surfaces as an unhandled 'error' event: a raw
  // EADDRINUSE stack trace that says nothing about what to do next. The usual
  // cause in development is `npm run dev` already running from the repo root,
  // which starts this same server alongside the frontends — so say that.
  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      logger.error(
        `Port ${env.PORT} is already in use. Another server is running on it — ` +
          `most likely \`npm run dev\` from the repo root, which already starts this ` +
          `backend. Use that, or stop it first (lsof -nP -iTCP:${env.PORT} -sTCP:LISTEN).`,
      );
      process.exit(1);
    }
    logger.error("Server error", { error: error.stack ?? error });
    process.exit(1);
  });

  // Self-heals the live sitemap after every deploy/PM2 restart — a frontend
  // deploy re-uploads its whole `dist/` and would otherwise clobber whatever
  // City/Test/Package-triggered rebuild had run since the last one (see
  // `sitemapGenerator.service.ts`). Fire-and-forget: a slow or failing
  // rebuild must never delay the server actually accepting requests.
  regenerateSitemap().catch((error) => {
    logger.error("Startup sitemap regeneration failed", {
      error: error instanceof Error ? error.message : error,
    });
  });

  // WhatsApp sample-collection reminders (no-op for customers who never
  // messaged us on WhatsApp).
  const reminderJob = startReminderJob();
  // "Repeat this test" reminders (sent 9 AM–8 PM IST).
  const followUpJob = startFollowUpJob();

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    clearInterval(reminderJob);
    clearInterval(followUpJob);
    server.close(async () => {
      await disconnectDatabase();
      logger.info("Shutdown complete");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  logger.error("Failed to start server", { error: err instanceof Error ? err.stack : err });
  process.exit(1);
});

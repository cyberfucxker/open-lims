import compression from "compression";
import cors from "cors";
import express, { type Application } from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { phleboSwaggerSpec, swaggerSpec } from "./config/swagger";
import { notFoundHandler } from "./middleware/notFound.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { globalRateLimiter } from "./middleware/rateLimiter.middleware";
import { morganStream } from "./utils/logger";
import { ApiResponse } from "./utils/ApiResponse";
import { apiRouter } from "./routes";
import { appApiRouter } from "./routes/app";
import { sampleBoyApiRouter } from "./routes/phlebo";
import { cmsPublicRouter } from "./routes/cmsPublic.routes";
import { cmsPublicHtmlRouter } from "./routes/cmsPublicHtml.routes";
import { UPLOADS_DIR } from "./middleware/upload.middleware";
import { whatsappWebhookRouter } from "./routes/whatsappWebhook.routes";

export function createApp(): Application {
  const app = express();

  // Behind Nginx/ALB in production, Express sees the proxy's socket address
  // by default — `trust proxy` makes it read the real client IP from
  // X-Forwarded-For instead, which express-rate-limit and req.ip both rely on.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  // ^ `env.CORS_ORIGIN` is a string[] (see config/env.ts) — the `cors`
  // package accepts an array directly, allow-listing each entry.
  app.use(compression());
  // Razorpay webhook signatures are computed over the RAW request body —
  // this must be captured before express.json() parses/consumes it, and
  // must be registered before the generic json() middleware below.
  app.use("/api/v1/app/webhooks/razorpay", express.raw({ type: "*/*" }));
  // WhatsApp Cloud API webhook + signed report links — own raw parser, and
  // ahead of the global rate limiter (see whatsappWebhook.routes.ts).
  app.use("/api/webhook/whatsapp", whatsappWebhookRouter);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("combined", { stream: morganStream }));
  app.use(globalRateLimiter);

  // Report Settings' uploaded logo — served with an explicit cross-origin
  // resource policy so the frontend (a different origin/port) can render it
  // in an <img> tag despite helmet's default same-origin CORP header.
  app.use(
    "/uploads",
    express.static(UPLOADS_DIR, {
      setHeaders: (res) => res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"),
    }),
  );

  app.get("/health", (_req, res) => {
    res.status(200).json(
      ApiResponse.success("Service is healthy", {
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      }),
    );
  });

  app.use("/api/v1", apiRouter);
  app.use("/api/v1/app", appApiRouter);
  app.use("/api/v1/sample-boy", sampleBoyApiRouter);
  // Public, unauthenticated — CMS content for both the Patient App and
  // Phlebo App (About/Privacy/Terms/FAQs/etc.), only PUBLISHED pages.
  app.use("/api/v1/cms", cmsPublicRouter);

  // Swagger UI's inline scripts/styles need helmet's default CSP relaxed —
  // only for this subtree, not the API itself.
  app.get("/api/v1/app/docs.json", (_req, res) => res.status(200).json(swaggerSpec));
  app.use(
    "/api/v1/app/docs",
    (_req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.removeHeader("Content-Security-Policy");
      next();
    },
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec),
  );

  app.get("/api/v1/sample-boy/docs.json", (_req, res) => res.status(200).json(phleboSwaggerSpec));
  app.use(
    "/api/v1/sample-boy/docs",
    (_req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.removeHeader("Content-Security-Policy");
      next();
    },
    swaggerUi.serve,
    swaggerUi.setup(phleboSwaggerSpec),
  );

  // Plain HTML CMS pages for direct loading in a mobile WebView, at the
  // exact root-level public URLs requested (`/about-us`, `/phlebo/about-us`,
  // etc.) — distinct from the JSON API mounted above. Registered LAST
  // (still before the 404/error handlers) since `/:slug` matches any single
  // path segment: every more specific route above (health/api/uploads) is
  // tried first and already responds before Express reaches this catch-all.
  // Any future single-segment root route must be registered ABOVE this line
  // or it will be shadowed.
  app.use("/", cmsPublicHtmlRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

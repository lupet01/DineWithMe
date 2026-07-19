// This file configures the initialization of Sentry for edge runtime
// (middleware, edge API routes). https://docs.sentry.io/platforms/javascript/guides/nextjs/
//
// Safe with no DSN configured - see sentry.client.config.ts.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: false,
});

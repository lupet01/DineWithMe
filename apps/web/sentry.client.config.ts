// This file configures the initialization of Sentry on the client (browser).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
//
// Safe with no DSN configured - Sentry.init() with an empty/undefined dsn
// disables the SDK rather than throwing, so this is a no-op until
// NEXT_PUBLIC_SENTRY_DSN is set.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  // Session replay is opt-in and off by default here - enable by adding
  // Sentry.replayIntegration() once a DSN is configured and replay is
  // actually wanted, since it has its own separate pricing/quota.
  debug: false,
});

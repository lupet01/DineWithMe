/**
 * Next.js instrumentation hook — runs once on server startup.
 * Used to initialize the analytics client with the PostHog provider.
 *
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only initialize on the Node.js runtime (not edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { analytics } = await import("@dinewithme/analytics");
    const { PostHogProvider } = await import("@dinewithme/analytics/src/providers/posthog");

    const enabled =
      process.env.ANALYTICS_ENABLED === "true" && !!process.env.POSTHOG_API_KEY;

    analytics.initialize({
      provider: new PostHogProvider({
        apiKey: process.env.POSTHOG_API_KEY,
        host: process.env.POSTHOG_HOST,
      }),
      enabled,
      debug: process.env.ANALYTICS_DEBUG === "true",
    });
  }
}

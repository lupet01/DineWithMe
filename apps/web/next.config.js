const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@dinewithme/shared", "@dinewithme/db", "@dinewithme/analytics"],
  // Enable instrumentation hook for server-side initialization (analytics, etc.)
  experimental: {
    instrumentationHook: true,
  },
  
  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
      },
    ],
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // PWA support and security headers
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // 'unsafe-eval' is required in dev only - Next.js Fast Refresh's
              // runtime evals module wrappers on every hot reload, and without
              // it the eval throws and silently kills client hydration for the
              // whole page (not just a console warning - confirmed via testing
              // that no client component responds to input at all when this is
              // missing in dev). Production never gets 'unsafe-eval'.
              `script-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com${
                process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""
              }`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://img.clerk.com https://*.r2.cloudflarestorage.com https://*.r2.dev https://api.mapbox.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com https://app.posthog.com https://api.posthog.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://api.mapbox.com https://events.mapbox.com",
              "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

// Wraps the config for Sentry source-map upload + tunneling. Safe with no
// Sentry org/project/auth-token configured - the plugin just skips the
// source-map-upload step and logs nothing is uploaded; it does not fail
// the build.
module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  // Tunnels client Sentry events through our own domain to avoid ad-blockers
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
});
